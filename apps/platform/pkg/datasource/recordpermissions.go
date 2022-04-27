package datasource

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

type tokenFunc func(loadable.Item) (string, bool, error)

func loadInAccessFieldData(op *adapt.SaveOp, collectionMetadata *adapt.CollectionMetadata, connection adapt.Connection, session *sess.Session) error {
	referencedCollections := adapt.ReferenceRegistry{}

	metadata := connection.GetMetadata()

	fieldMetadata, err := collectionMetadata.GetField(collectionMetadata.AccessField)
	if err != nil {
		return err
	}

	if fieldMetadata.Type != "REFERENCE" {
		return errors.New("Access field must be a reference field: " + collectionMetadata.AccessField)
	}

	refCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferenceMetadata.Collection)
	if err != nil {
		return err
	}

	refReq := referencedCollections.Get(fieldMetadata.ReferenceMetadata.Collection)
	refReq.Metadata = refCollectionMetadata

	// Load in all Fields
	fields := []adapt.LoadRequestField{}

	for fieldID := range refCollectionMetadata.Fields {
		fields = append(fields, adapt.LoadRequestField{
			ID: fieldID,
		})
	}

	refReq.AddFields(fields)

	err = op.LoopChanges(func(change *adapt.ChangeItem) error {
		fk, err := change.GetField(collectionMetadata.AccessField)
		if err != nil {
			return err
		}
		fkField, err := adapt.GetReferenceKey(fk)
		if err != nil {
			return err
		}
		refReq.AddID(fkField, adapt.ReferenceLocator{
			Item:  change,
			Field: fieldMetadata,
		})
		return nil
	})
	if err != nil {
		return err
	}

	return adapt.HandleReferences(connection, referencedCollections)
}

func handleStandardChange(change *adapt.ChangeItem, tokenFuncs []tokenFunc, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) error {
	ownerID, err := change.GetOwnerID()
	if err != nil {
		return err
	}
	ownerToken := "uesio.owner:" + ownerID
	change.AddReadWriteToken(ownerToken)

	hasToken := false

	for _, userToken := range session.GetTokens() {
		if ownerToken == userToken {
			hasToken = true
		}
	}

	for _, tokenFunc := range tokenFuncs {
		token, isReadWrite, err := tokenFunc(change)
		if err != nil {
			return err
		}

		if isReadWrite {
			for _, userToken := range session.GetTokens() {
				if token == userToken {
					hasToken = true
				}
			}
			change.AddReadWriteToken(token)
		} else {
			change.AddReadToken(token)
		}
	}

	if !hasToken {
		return errors.New("User does not have access to write to this field: " + change.IDValue)
	}

	return nil

}

func handleAccessFieldChange(accessFieldKey string, change *adapt.ChangeItem, tokenFuncs []tokenFunc, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) error {

	accessItem, err := change.FieldChanges.GetField(accessFieldKey)
	if err != nil {
		return err
	}

	accessItemConcrete, ok := accessItem.(loadable.Item)
	if !ok {
		return fmt.Errorf("Couldn't convert item: %T", accessItem)
	}

	ownerObj, err := accessItemConcrete.GetField("uesio/core.owner")
	if err != nil {
		return err
	}

	ownerID, err := adapt.GetReferenceKey(ownerObj)
	if err != nil {
		return err
	}

	ownerToken := "uesio.owner:" + ownerID

	hasToken := false

	for _, userToken := range session.GetTokens() {
		if ownerToken == userToken {
			hasToken = true
		}
	}

	for _, tokenFunc := range tokenFuncs {
		token, isReadWrite, err := tokenFunc(accessItemConcrete)
		if err != nil {
			return err
		}

		// We don't care about read tokens here because we're doing a write
		if isReadWrite {

			for _, userToken := range session.GetTokens() {
				if token == userToken {
					hasToken = true
					break
				}
			}
		}
	}

	if !hasToken {
		return errors.New("User does not have parent access to write to this field: " + change.IDValue)
	}

	return nil
}

func GenerateRecordChallengeTokens(op *adapt.SaveOp, collectionMetadata *adapt.CollectionMetadata, connection adapt.Connection, session *sess.Session) error {

	if collectionMetadata.Access != "protected" {
		return nil
	}

	// If we have an access field, we need to load in all data from that field
	if collectionMetadata.AccessField != "" {
		err := loadInAccessFieldData(op, collectionMetadata, connection, session)
		if err != nil {
			return err
		}
	}

	metadata := connection.GetMetadata()

	challengeMetadata, err := adapt.GetChallengeCollection(metadata, collectionMetadata)
	if err != nil {
		return err
	}

	tokenFuncs := []tokenFunc{}

	for _, challengeToken := range challengeMetadata.RecordChallengeTokens {
		tokenTemplate, err := adapt.NewFieldChanges(challengeToken.Token, challengeMetadata)
		if err != nil {
			return err
		}
		tokenFuncs = append(tokenFuncs, func(item loadable.Item) (string, bool, error) {
			tokenValue, err := templating.Execute(tokenTemplate, item)
			if err != nil {
				return "", false, err
			}
			return challengeToken.UserAccessToken + ":" + tokenValue, challengeToken.Access == "readwrite", nil
		})
	}

	return op.LoopChanges(func(change *adapt.ChangeItem) error {
		if collectionMetadata.AccessField != "" {
			return handleAccessFieldChange(collectionMetadata.AccessField, change, tokenFuncs, challengeMetadata, session)
		}
		return handleStandardChange(change, tokenFuncs, collectionMetadata, session)
	})

}

func GenerateUserAccessTokens(metadata *adapt.MetadataCache, loadOptions *LoadOptions, session *sess.Session) error {

	if !session.HasToken("uesio.owner") {
		session.AddToken("uesio.owner", []string{session.GetUserID()})
	}

	userAccessTokenNames := map[string]bool{}
	for _, collectionMetadata := range metadata.Collections {
		challengeMetadata, err := adapt.GetChallengeCollection(metadata, collectionMetadata)
		if err != nil {
			return err
		}

		for _, challengeToken := range challengeMetadata.RecordChallengeTokens {
			if challengeToken.UserAccessToken != "" {
				if !session.HasToken(challengeToken.UserAccessToken) {
					userAccessTokenNames[challengeToken.UserAccessToken] = true
				}
			}
		}
	}

	for key := range userAccessTokenNames {
		uat, err := meta.NewUserAccessToken(key)
		if err != nil {
			return err
		}
		err = bundle.Load(uat, session)
		if err != nil {
			return err
		}
		if uat.Type == "lookup" {
			fieldKeys := templating.ExtractKeys(uat.Token)
			fields := []adapt.LoadRequestField{}
			for _, fieldKey := range fieldKeys {
				fields = append(fields, adapt.LoadRequestField{
					ID: fieldKey,
				})
			}

			loadConditions := []adapt.LoadRequestCondition{}
			for _, condition := range uat.Conditions {
				fields = append(fields, adapt.LoadRequestField{
					ID: condition.Field,
				})
				loadConditions = append(loadConditions, adapt.LoadRequestCondition{
					Field:    condition.Field,
					Value:    session.GetUserID(),
					Operator: "=",
				})
			}

			lookupResults := &adapt.Collection{}
			var loadOp = &adapt.LoadOp{
				CollectionName: uat.Collection,
				WireName:       "foo",
				Collection:     lookupResults,
				Conditions:     loadConditions,
				Fields:         fields,
				Query:          true,
			}

			err = getMetadataForLoad(loadOp, loadOptions.Metadata, []*adapt.LoadOp{loadOp}, session)
			if err != nil {
				return err
			}

			loadCollectionMetadata, err := loadOptions.Metadata.GetCollection(uat.Collection)
			if err != nil {
				return err
			}

			connection, err := GetConnection(loadCollectionMetadata.DataSource, session.GetTokens(), loadOptions.Metadata, session, loadOptions.Connections)
			if err != nil {
				return err
			}

			err = connection.Load(loadOp)
			if err != nil {
				return err
			}

			template, err := adapt.NewFieldChanges(uat.Token, loadCollectionMetadata)
			if err != nil {
				return err
			}
			tokenStrings := []string{}
			err = lookupResults.Loop(func(record loadable.Item, _ string) error {
				tokenValue, err := templating.Execute(template, record)
				if err != nil {
					return err
				}
				tokenStrings = append(tokenStrings, tokenValue)
				return nil
			})
			if err != nil {
				return err
			}
			session.AddToken(uat.GetKey(), tokenStrings)
		}
	}

	return nil
}

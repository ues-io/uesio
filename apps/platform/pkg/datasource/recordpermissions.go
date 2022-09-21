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

func getAccessFields(collectionMetadata *adapt.CollectionMetadata, metadata *adapt.MetadataCache) ([]adapt.LoadRequestField, error) {
	if collectionMetadata.AccessField == "" {
		return nil, nil
	}

	fieldMetadata, err := collectionMetadata.GetField(collectionMetadata.AccessField)
	if err != nil {
		return nil, err
	}

	refCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferenceMetadata.Collection)
	if err != nil {
		return nil, err
	}

	fields := []adapt.LoadRequestField{}

	for fieldID, fieldInfo := range refCollectionMetadata.Fields {
		// TODO: We should be better about deciding which field we load in here
		if fieldInfo.Type == "REFERENCEGROUP" {
			continue
		}
		var subFields []adapt.LoadRequestField
		if fieldID == refCollectionMetadata.AccessField {
			subFields, err = getAccessFields(refCollectionMetadata, metadata)
			if err != nil {
				return nil, err
			}
		}

		fields = append(fields, adapt.LoadRequestField{
			ID:     fieldID,
			Fields: subFields,
		})
	}

	return fields, nil

}

func loadInAccessFieldData(op *adapt.SaveOp, collectionMetadata *adapt.CollectionMetadata, connection adapt.Connection, session *sess.Session) error {
	referencedCollections := adapt.ReferenceRegistry{}

	metadata := connection.GetMetadata()

	fieldMetadata, err := collectionMetadata.GetField(collectionMetadata.AccessField)
	if err != nil {
		return err
	}

	refCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferenceMetadata.Collection)
	if err != nil {
		return err
	}

	fields, err := getAccessFields(collectionMetadata, metadata)
	if err != nil {
		return err
	}

	refReq := referencedCollections.Get(fieldMetadata.ReferenceMetadata.Collection)
	refReq.Metadata = refCollectionMetadata

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
		return refReq.AddID(fkField, adapt.ReferenceLocator{
			Item:  change,
			Field: fieldMetadata,
		})
	})
	if err != nil {
		return err
	}

	return adapt.HandleReferences(connection, referencedCollections, session, false)
}

func handleStandardChange(change *adapt.ChangeItem, tokenFuncs []tokenFunc, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) error {
	ownerID, err := change.GetOwnerID()
	if err != nil {
		return err
	}
	ownerToken := "uesio.owner:" + ownerID
	change.AddReadWriteToken(ownerToken)

	hasToken := false

	userCanModifyAllRecords := session.GetContextPermissions().ModifyAllRecords

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

	if !hasToken && !userCanModifyAllRecords {
		return errors.New("User does not have access to write to this field: " + change.UniqueKey)
	}

	return nil

}

func handleAccessFieldChange(change *adapt.ChangeItem, tokenFuncs []tokenFunc, collectionMetadata *adapt.CollectionMetadata, metadata *adapt.MetadataCache, session *sess.Session) error {

	var accessItem loadable.Item

	accessItem = change.FieldChanges

	challengeMetadata := collectionMetadata

	userCanModifyAllRecords := session.GetContextPermissions().ModifyAllRecords

	for challengeMetadata.AccessField != "" {
		accessInterface, err := accessItem.GetField(challengeMetadata.AccessField)
		if err != nil {
			return err
		}
		var ok bool
		accessItem, ok = accessInterface.(loadable.Item)
		if !ok {
			return fmt.Errorf("Couldn't convert item: %T", accessInterface)
		}

		fieldMetadata, err := challengeMetadata.GetField(challengeMetadata.AccessField)
		if err != nil {
			return err
		}
		challengeMetadata, err = metadata.GetCollection(fieldMetadata.ReferenceMetadata.Collection)
		if err != nil {
			return err
		}
	}

	ownerObj, err := accessItem.GetField("uesio/core.owner")
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
			//fmt.Println("GRANTED BASED ON OWNER OF: " + challengeMetadata.GetFullName())
		}
	}

	for _, tokenFunc := range tokenFuncs {
		token, isReadWrite, err := tokenFunc(accessItem)
		if err != nil {
			return err
		}

		// We don't care about read tokens here because we're doing a write
		if isReadWrite {
			for _, userToken := range session.GetTokens() {
				if token == userToken {
					//fmt.Println("GRANTED BASED ON TOKEN: " + challengeMetadata.GetFullName() + " MATCHING " + token)
					hasToken = true
					break
				}
			}
		}
	}

	if !hasToken && !userCanModifyAllRecords {
		return errors.New("User does not have parent access to write to this field: " + change.IDValue)
	}

	return nil
}

func GenerateRecordChallengeTokens(op *adapt.SaveOp, collectionMetadata *adapt.CollectionMetadata, connection adapt.Connection, session *sess.Session) error {

	if !collectionMetadata.IsWriteProtected() {
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

	for index := range challengeMetadata.RecordChallengeTokens {
		challengeToken := challengeMetadata.RecordChallengeTokens[index]
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
			return handleAccessFieldChange(change, tokenFuncs, collectionMetadata, metadata, session)
		}
		return handleStandardChange(change, tokenFuncs, collectionMetadata, session)
	})

}

func GenerateUserAccessTokens(metadata *adapt.MetadataCache, loadOptions *LoadOptions, session *sess.Session) error {

	if !session.HasToken("uesio.owner") {
		session.AddToken("uesio.owner", []string{session.GetUserID()})
	}

	// A special user access token type for installed deps
	tokenStrings := []string{}
	for key := range session.GetContextAppBundle().Dependencies {
		tokenStrings = append(tokenStrings, key)
	}
	session.AddToken("uesio.installed", tokenStrings)

	userAccessTokenNames := map[string]bool{}
	for _, collectionMetadata := range metadata.Collections {

		challengeMetadata := collectionMetadata

		for challengeMetadata.AccessField != "" {
			fieldMetadata, err := challengeMetadata.GetField(challengeMetadata.AccessField)
			if err != nil {
				return err
			}
			challengeMetadata, err = metadata.GetCollection(fieldMetadata.ReferenceMetadata.Collection)
			if err != nil {
				return err
			}
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
					// This is somewhat wierd, but it prevents reference
					// fields in the token from being fully loaded.
					// It shouldn't affect other fields
					Fields: []adapt.LoadRequestField{
						{
							ID: adapt.ID_FIELD,
						},
					},
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

			connection, err := GetConnection(loadCollectionMetadata.DataSource, loadOptions.Metadata, session, loadOptions.Connections)
			if err != nil {
				return err
			}

			err = connection.Load(loadOp, session)
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

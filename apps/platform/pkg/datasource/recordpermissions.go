package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func getTokensForChange(change *adapt.ChangeItem, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) error {

	ownerID, err := change.GetOwnerID()
	if err != nil {
		return err
	}

	change.AddReadWriteToken("uesio.owner:" + ownerID)

	for _, challengeToken := range collectionMetadata.RecordChallengeTokens {

		tokenTemplate, err := adapt.NewFieldChanges(challengeToken.Token, collectionMetadata)
		if err != nil {
			return err
		}

		tokenValue, err := templating.Execute(tokenTemplate, change)
		if err != nil {
			return err
		}

		fullTokenString := challengeToken.UserAccessToken + ":" + tokenValue
		if challengeToken.Access == "readwrite" {
			change.AddReadWriteToken(fullTokenString)
		} else if challengeToken.Access == "read" {
			change.AddReadToken(fullTokenString)
		}
		return nil

	}

	return nil
}

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

	return op.LoopChanges(func(change *adapt.ChangeItem) error {
		return getTokensForChange(change, challengeMetadata, session)
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

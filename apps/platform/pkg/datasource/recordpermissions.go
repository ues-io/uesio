package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func GenerateRecordChallengeTokens(op *adapt.SaveOp, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) error {

	if collectionMetadata.Access != "protected" {
		return nil
	}

	for i := range *op.Inserts {
		insert := &(*op.Inserts)[i]
		insert.AddReadWriteToken("uesio.owner:" + session.GetUserInfo().ID)
	}

	for i := range *op.Updates {
		update := &(*op.Updates)[i]
		ownerID, err := update.GetOwnerID()
		if err != nil {
			return err
		}
		update.AddReadWriteToken("uesio.owner:" + ownerID)
	}

	for _, challengeToken := range collectionMetadata.RecordChallengeTokens {

		tokenTemplate, err := adapt.NewFieldChanges(challengeToken.Token, collectionMetadata)
		if err != nil {
			return err
		}
		// Loop over each insert and update and fill in token values
		for i := range *op.Updates {
			update := &(*op.Updates)[i]
			tokenValue, err := templating.Execute(tokenTemplate, update.FieldChanges)
			if err != nil {
				tokenValue, err = templating.Execute(tokenTemplate, update.OldValues)
				if err != nil {
					return err
				}
			}

			fullTokenString := challengeToken.UserAccessToken + ":" + tokenValue
			if challengeToken.Access == "readwrite" {
				update.AddReadWriteToken(fullTokenString)
			} else if challengeToken.Access == "read" {
				update.AddReadToken(fullTokenString)
			}
		}

		for i := range *op.Inserts {
			insert := &(*op.Inserts)[i]
			tokenValue, err := templating.Execute(tokenTemplate, insert.FieldChanges)
			if err != nil {
				return err
			}

			fullTokenString := challengeToken.UserAccessToken + ":" + tokenValue
			if challengeToken.Access == "readwrite" {
				insert.AddReadWriteToken(fullTokenString)
			} else if challengeToken.Access == "read" {
				insert.AddReadToken(fullTokenString)
			}
		}
	}

	return nil
}

func GenerateUserAccessTokens(metadata *adapt.MetadataCache, session *sess.Session) ([]string, error) {

	tokenStrings := []string{"uesio.owner:" + session.GetUserInfo().ID}

	userAccessTokenNames := map[string]bool{}
	for _, collectionMetadata := range metadata.Collections {
		if collectionMetadata.Access != "protected" {
			continue
		}
		for _, challengeToken := range collectionMetadata.RecordChallengeTokens {
			if challengeToken.UserAccessToken != "" {
				userAccessTokenNames[challengeToken.UserAccessToken] = true
			}
		}
	}

	for key := range userAccessTokenNames {
		uat, err := meta.NewUserAccessToken(key)
		if err != nil {
			return nil, err
		}
		err = bundle.Load(uat, session)
		if err != nil {
			return nil, err
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
					Value:    session.GetUserInfo().ID,
					Operator: "=",
				})
			}
			lookupResults := &adapt.Collection{}
			var loadOps = []adapt.LoadOp{{
				CollectionName: uat.Collection,
				WireName:       "foo",
				Collection:     lookupResults,
				Conditions:     loadConditions,
				Fields:         fields,
				Query:          true,
			}}
			loadMetadata, err := LoadWithOptions(loadOps, session, false)
			if err != nil {
				return nil, err
			}

			loadCollectionMetadata, err := loadMetadata.GetCollection(uat.Collection)
			if err != nil {
				return nil, err
			}

			template, err := adapt.NewFieldChanges(uat.Token, loadCollectionMetadata)
			if err != nil {
				return nil, err
			}
			err = lookupResults.Loop(func(record loadable.Item, _ interface{}) error {
				tokenValue, err := templating.Execute(template, record)
				if err != nil {
					return err
				}
				tokenStrings = append(tokenStrings, uat.GetKey()+":"+tokenValue)
				return nil
			})
			if err != nil {
				return nil, err
			}
		}
	}

	return tokenStrings, nil
}

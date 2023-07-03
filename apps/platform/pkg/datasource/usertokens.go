package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func GenerateUserAccessTokens(metadata *adapt.MetadataCache, loadOptions *LoadOptions, session *sess.Session) error {

	if !session.HasToken("uesio.owner") {
		session.AddToken("uesio.owner", []string{session.GetUserID()})
	}

	// A special user access token type for installed deps
	depTokens := []string{}
	for key := range session.GetContextAppBundle().Dependencies {
		depTokens = append(depTokens, key)
	}
	session.AddToken("uesio.installed", depTokens)

	// A special user access token type for named permissions
	namedPermTokens := []string{}
	for key := range session.GetContextPermissions().NamedRefs {
		namedPermTokens = append(namedPermTokens, key)
	}
	session.AddToken("uesio.namedpermission", namedPermTokens)

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
		err = bundle.Load(uat, session, nil)
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

			connection, err := GetConnection(loadCollectionMetadata.DataSource, metadata, session, loadOptions.Connection)
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
			err = lookupResults.Loop(func(record meta.Item, _ string) error {
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

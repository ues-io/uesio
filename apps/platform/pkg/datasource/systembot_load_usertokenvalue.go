package datasource

import (
	"github.com/teris-io/shortid"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func UserAccessTokens(metadata *adapt.MetadataCache, loadOptions *LoadOptions, session *sess.Session) []string {

	flatTokens := []string{}

	if !session.HasToken("uesio.owner") {
		flatTokens = append(flatTokens, "uesio.owner"+":"+session.GetUserID())
	}

	// A special user access token type for installed deps
	for key := range session.GetContextAppBundle().Dependencies {
		flatTokens = append(flatTokens, "uesio.installed"+":"+key)
	}

	// A special user access token type for named permissions
	for key := range session.GetContextPermissions().NamedRefs {
		flatTokens = append(flatTokens, "uesio.namedpermission"+":"+key)
	}

	userAccessTokenNames := map[string]bool{}
	for _, collectionMetadata := range metadata.Collections {

		challengeMetadata := collectionMetadata

		for challengeMetadata.AccessField != "" {
			fieldMetadata, err := challengeMetadata.GetField(challengeMetadata.AccessField)
			if err != nil {
				return nil
			}
			challengeMetadata, err = metadata.GetCollection(fieldMetadata.ReferenceMetadata.Collection)
			if err != nil {
				return nil
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
			return nil
		}
		err = bundle.Load(uat, session, nil)
		if err != nil {
			return nil
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

			platformConnection, err := GetPlatformConnection(session, loadOptions.Connections)
			if err != nil {
				return nil
			}

			err = getMetadataForLoad(loadOp, loadOptions.Metadata, []*adapt.LoadOp{loadOp}, session, platformConnection)
			if err != nil {
				return nil
			}

			loadCollectionMetadata, err := loadOptions.Metadata.GetCollection(uat.Collection)
			if err != nil {
				return nil
			}

			connection, err := GetConnection(loadCollectionMetadata.DataSource, loadOptions.Metadata, session, loadOptions.Connections)
			if err != nil {
				return nil
			}

			err = connection.Load(loadOp, session)
			if err != nil {
				return nil
			}

			template, err := adapt.NewFieldChanges(uat.Token, loadCollectionMetadata)
			if err != nil {
				return nil
			}
			tokenStrings := []string{}
			err = lookupResults.Loop(func(record meta.Item, _ string) error {
				tokenValue, err := templating.Execute(template, record)
				if err != nil {
					return nil
				}
				tokenStrings = append(tokenStrings, tokenValue)
				return nil
			})
			if err != nil {
				return nil
			}
			session.AddToken(uat.GetKey(), tokenStrings)
		}
	}

	return flatTokens
}

func runUserTokenValueLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	metadata := connection.GetMetadata()
	userTokens := UserAccessTokens(metadata, nil, session)

	collectionMetadata, err := metadata.GetCollection("uesio/studio.usertokenvalue")
	if err != nil {
		return err
	}

	collectionMetadata.SetField(&adapt.FieldMetadata{
		Name:       "name",
		Namespace:  "uesio/studio",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "TEXT",
		Label:      "Name",
	})

	for _, token := range userTokens {

		opItem := op.Collection.NewItem()
		op.Collection.AddItem(opItem)
		fakeID, _ := shortid.Generate()

		opItem.SetField("uesio/core.id", fakeID)
		opItem.SetField("uesio/studio.name", token)

	}

	return nil

}

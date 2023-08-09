package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

type UserAccessTokenValue struct {
	UserAccessToken meta.UserAccessToken
	Value           string
}

// func GenerateUserAccessTokens(connection adapt.Connection, session *sess.Session) error {

// 	metadata := connection.GetMetadata()
// 	var uatc meta.UserAccessTokenCollection
// 	TEST := []meta.BundleableItem{}
// 	for _, collectionMetadata := range metadata.Collections {

// 		challengeMetadata := collectionMetadata

// 		for challengeMetadata.AccessField != "" {
// 			fieldMetadata, err := challengeMetadata.GetField(challengeMetadata.AccessField)
// 			if err != nil {
// 				return err
// 			}
// 			challengeMetadata, err = metadata.GetCollection(fieldMetadata.ReferenceMetadata.Collection)
// 			if err != nil {
// 				return err
// 			}
// 		}

// 		for _, challengeToken := range challengeMetadata.RecordChallengeTokens {
// 			if challengeToken.UserAccessToken != "" && challengeToken.UserAccessToken != "uesio.owner" && challengeToken.UserAccessToken != "uesio.installed" && challengeToken.UserAccessToken != "uesio.namedpermission" {
// 				token, err := meta.NewUserAccessToken(challengeToken.UserAccessToken)
// 				if err != nil {
// 					return err
// 				}
// 				TEST = append(TEST, token)
// 				uatc.AddItem(token)
// 			}
// 		}
// 	}

// 	err := bundle.LoadMany(TEST, session, connection)
// 	if err != nil {
// 		return err
// 	}

// 	tokens, err := processTokens(uatc, connection, session)
// 	if err != nil {
// 		return err
// 	}

// 	addTokensToSession(tokens, session)

// 	return nil
// }

func GenerateUserAccessTokens(connection adapt.Connection, session *sess.Session) error {
	var uatc meta.UserAccessTokenCollection
	err := bundle.LoadAllFromAny(&uatc, nil, session, nil)
	if err != nil {
		return err
	}

	tokens, err := processTokens(uatc, connection, session)
	if err != nil {
		return err
	}

	addTokensToSession(tokens, session)

	return nil
}

func GetAllUserAccessTokens(connection adapt.Connection, session *sess.Session) ([]UserAccessTokenValue, error) {
	var uatc meta.UserAccessTokenCollection
	err := bundle.LoadAllFromAny(&uatc, nil, session, nil)
	if err != nil {
		return nil, err
	}
	return processTokens(uatc, connection, session)
}

func addTokensToSession(tokens []UserAccessTokenValue, session *sess.Session) {
	for _, token := range tokens {
		if !session.HasToken(token.UserAccessToken.Name) {
			session.AddToken(token.UserAccessToken.Name, []string{token.Value})
		}
	}
}
func processTokens(uatc meta.UserAccessTokenCollection, connection adapt.Connection, session *sess.Session) ([]UserAccessTokenValue, error) {

	metadata := connection.GetMetadata()
	flatTokens := []UserAccessTokenValue{}

	ownerToken := UserAccessTokenValue{*meta.NewBaseUserAccessToken("", "uesio.owner"), session.GetUserID()}
	flatTokens = append(flatTokens, ownerToken)

	// A special user access token type for installed deps
	for key := range session.GetContextAppBundle().Dependencies {
		installedToken := UserAccessTokenValue{*meta.NewBaseUserAccessToken("", "uesio.installed"), key}
		flatTokens = append(flatTokens, installedToken)
	}

	// A special user access token type for named permissions
	for key := range session.GetContextPermissions().NamedRefs {
		namedRefsToken := UserAccessTokenValue{*meta.NewBaseUserAccessToken("", "uesio.namedpermission"), key}
		flatTokens = append(flatTokens, namedRefsToken)
	}

	// To ensure we have access to all of the collections involved in user access token calculation,
	// get an admin session
	adminSession := GetSiteAdminSession(session)

	for _, uat := range uatc {
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

			err := getMetadataForLoad(loadOp, metadata, []*adapt.LoadOp{loadOp}, adminSession)
			if err != nil {
				return flatTokens, err
			}

			loadCollectionMetadata, err := metadata.GetCollection(uat.Collection)
			if err != nil {
				return flatTokens, err
			}

			err = connection.Load(loadOp, session)
			if err != nil {
				return flatTokens, err
			}

			template, err := adapt.NewFieldChanges(uat.Token, loadCollectionMetadata)
			if err != nil {
				return flatTokens, err
			}

			err = lookupResults.Loop(func(record meta.Item, _ string) error {
				tokenValue, err := templating.Execute(template, record)
				if err != nil {
					return err
				}
				flatTokens = append(flatTokens, UserAccessTokenValue{*uat, tokenValue})
				return nil
			})
			if err != nil {
				return flatTokens, err
			}

		}
	}

	return flatTokens, nil
}

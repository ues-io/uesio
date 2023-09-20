package datasource

import (
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

var OWNER_TOKEN = "uesio.owner"
var INSTALLED_TOKEN = "uesio.installed"
var NAMED_PERMISSION_TOKEN = "uesio.namedpermission"

func getTokensForRequest(connection adapt.Connection, session *sess.Session, tokenMap sess.TokenMap) (meta.UserAccessTokenCollection, error) {
	metadata := connection.GetMetadata()
	uatc := meta.UserAccessTokenCollection{}
	tokens := []meta.BundleableItem{}

	userAccessTokenNames := map[string]bool{}
	for _, collectionMetadata := range metadata.Collections {

		challengeMetadata := collectionMetadata

		for challengeMetadata.AccessField != "" {
			fieldMetadata, err := challengeMetadata.GetField(challengeMetadata.AccessField)
			if err != nil {
				return nil, err
			}
			challengeMetadata, err = metadata.GetCollection(fieldMetadata.ReferenceMetadata.Collection)
			if err != nil {
				return nil, err
			}
		}

		for _, challengeToken := range challengeMetadata.RecordChallengeTokens {
			if challengeToken.UserAccessToken != "" {
				if !tokenMap.Has(challengeToken.UserAccessToken) {
					userAccessTokenNames[challengeToken.UserAccessToken] = true
				}
			}
		}
	}

	for key := range userAccessTokenNames {
		// Skip loading of builtin user access tokens
		if key == OWNER_TOKEN || key == INSTALLED_TOKEN || key == NAMED_PERMISSION_TOKEN {
			continue
		}
		token, err := meta.NewUserAccessToken(key)
		if err != nil {
			return nil, err
		}
		tokens = append(tokens, token)
	}

	err := bundle.LoadMany(tokens, session, nil)
	if err != nil {
		return nil, err
	}

	// BH: This is dumb that we have to loop again, but I can't find a way around this.
	for _, token := range tokens {
		uatc.AddItem(token.(*meta.UserAccessToken))
	}

	return uatc, nil
}

func getFieldsMap(fieldKeys []string) *FieldsMap {
	fieldsMap := FieldsMap{}
	for _, fieldKey := range fieldKeys {
		fieldParts := strings.Split(fieldKey, constant.RefSep)
		if len(fieldParts) == 1 {
			// This is somewhat wierd, but it prevents reference
			// fields in the token from being fully loaded.
			// It shouldn't affect other fields
			fieldsMap[fieldKey] = FieldsMap{
				adapt.ID_FIELD: nil,
			}
		} else {
			fieldsMap[fieldParts[0]] = *getFieldsMap([]string{strings.Join(fieldParts[1:], constant.RefSep)})
		}
	}
	return &fieldsMap
}

func HydrateTokenMap(tokenMap sess.TokenMap, tokenDefs meta.UserAccessTokenCollection, connection adapt.Connection, session *sess.Session, reason bool) error {
	user := session.GetContextUser()
	if !tokenMap.Has(OWNER_TOKEN) {
		tokenMap.Add(OWNER_TOKEN, []sess.TokenValue{{
			Value:  user.ID,
			Reason: "Record Owner: " + user.UniqueKey},
		})
	}

	if !tokenMap.Has(INSTALLED_TOKEN) {
		// A special user access token type for installed deps
		depTokens := []sess.TokenValue{}
		for key := range session.GetContextAppBundle().Dependencies {
			depTokens = append(depTokens, sess.TokenValue{
				Value:  key,
				Reason: "App Installed: " + key,
			})
		}
		tokenMap.Add(INSTALLED_TOKEN, depTokens)
	}

	if !tokenMap.Has(NAMED_PERMISSION_TOKEN) {
		// A special user access token type for named permissions
		namedPermTokens := []sess.TokenValue{}
		for key := range session.GetContextPermissions().NamedRefs {
			namedPermTokens = append(namedPermTokens, sess.TokenValue{
				Value:  key,
				Reason: "Has Named Permission: " + key,
			})
		}
		tokenMap.Add(NAMED_PERMISSION_TOKEN, namedPermTokens)
	}

	// To ensure we have access to all of the collections involved in user access token calculation,
	// get an admin session
	adminSession := GetSiteAdminSession(session)
	metadata := connection.GetMetadata()

	for _, token := range tokenDefs {

		if token.Type == "lookup" {
			fieldsMap := getFieldsMap(templating.ExtractKeys(token.Token))
			if reason {
				fieldsMap.merge(getFieldsMap(templating.ExtractKeys(token.Reason)))
			}

			loadConditions := []adapt.LoadRequestCondition{}
			for _, condition := range token.Conditions {
				fieldsMap.merge(&FieldsMap{
					condition.Field: nil,
				})

				loadConditions = append(loadConditions, adapt.LoadRequestCondition{
					Field:    condition.Field,
					Value:    user.ID,
					Operator: "=",
				})
			}

			lookupResults := &adapt.Collection{}
			var loadOp = &adapt.LoadOp{
				CollectionName: token.Collection,
				WireName:       "foo",
				Collection:     lookupResults,
				Conditions:     loadConditions,
				Fields:         fieldsMap.getRequestFields(),
				Query:          true,
			}

			err := GetMetadataForLoad(loadOp, metadata, []*adapt.LoadOp{loadOp}, adminSession)
			if err != nil {
				return err
			}

			loadCollectionMetadata, err := metadata.GetCollection(token.Collection)
			if err != nil {
				return err
			}

			err = connection.Load(loadOp, adminSession)
			if err != nil {
				return err
			}

			template, err := adapt.NewFieldChanges(token.Token, loadCollectionMetadata, metadata)
			if err != nil {
				return err
			}

			reasonTemplate, err := adapt.NewFieldChanges(token.Reason, loadCollectionMetadata, metadata)
			if err != nil {
				return err
			}

			tokenStrings := []sess.TokenValue{}
			err = lookupResults.Loop(func(record meta.Item, _ string) error {
				tokenValue, err := templating.Execute(template, record)
				if err != nil {
					return err
				}
				reasonValue := ""
				if reason {
					reasonValue, err = templating.Execute(reasonTemplate, record)
					if err != nil {
						return err
					}
				}
				tokenStrings = append(tokenStrings, sess.TokenValue{
					Value:  tokenValue,
					Reason: reasonValue,
				})
				return nil
			})
			if err != nil {
				return err
			}
			tokenMap.Add(token.GetKey(), tokenStrings)
		}
	}

	return nil
}

func GenerateUserAccessTokens(connection adapt.Connection, session *sess.Session) error {

	tokenMap := session.GetTokenMap()

	tokenDefs, err := getTokensForRequest(connection, session, tokenMap)
	if err != nil {
		return err
	}

	err = HydrateTokenMap(tokenMap, tokenDefs, connection, session, false)
	if err != nil {
		return err
	}

	session.SetTokenMap(tokenMap)

	return nil
}

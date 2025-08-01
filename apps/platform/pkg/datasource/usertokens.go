package datasource

import (
	"context"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

var OWNER_TOKEN = "uesio.owner"
var INSTALLED_TOKEN = "uesio.installed"
var NAMED_PERMISSION_TOKEN = "uesio.namedpermission"

func getTokensForRequest(ctx context.Context, metadata *wire.MetadataCache, session *sess.Session, tokenMap sess.TokenMap) (meta.UserAccessTokenCollection, error) {

	uatc := meta.UserAccessTokenCollection{}
	var tokens []meta.BundleableItem

	userAccessTokenNames := map[string]bool{}
	for _, collectionMetadata := range metadata.Collections {

		challengeMetadata := collectionMetadata

		for challengeMetadata.AccessField != "" {
			fieldMetadata, err := challengeMetadata.GetField(challengeMetadata.AccessField)
			if err != nil {
				return nil, err
			}
			if fieldMetadata.ReferenceMetadata == nil {
				return nil, errors.New("access field is not a reference field")
			}
			challengeMetadata, err = metadata.GetCollection(fieldMetadata.ReferenceMetadata.GetCollection())
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

	// TBD: Why is connection nil here??
	if err := bundle.LoadMany(ctx, tokens, &bundlestore.GetManyItemsOptions{
		AllowMissingItems:     false,
		IgnoreUnlicensedItems: true,
	}, session, nil); err != nil {
		return nil, err
	}

	// BH: This is dumb that we have to loop again, but I can't find a way around this.
	for _, token := range tokens {
		uatc.AddItem(token.(*meta.UserAccessToken))
	}

	return uatc, nil
}

func HydrateTokenMap(ctx context.Context, tokenMap sess.TokenMap, tokenDefs meta.UserAccessTokenCollection, connection wire.Connection, metadata *wire.MetadataCache, session *sess.Session, reason bool) error {
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

	// To ensure we have access to all the collections involved in user access token calculation,
	// get an admin session
	adminSession := GetSiteAdminSession(session)

	for _, token := range tokenDefs {

		if token.Type == "lookup" {
			fieldsMap := getFieldsMap(templating.ExtractKeys(token.Token))
			if reason {
				fieldsMap.addMany(templating.ExtractKeys(token.Reason))
			}

			var loadConditions []wire.LoadRequestCondition
			for _, condition := range token.Conditions {
				fieldsMap.merge(&FieldsMap{
					condition.Field: nil,
				})

				loadConditions = append(loadConditions, wire.LoadRequestCondition{
					Field:    condition.Field,
					Value:    user.ID,
					Operator: "=",
				})
			}

			lookupResults := &wire.Collection{}
			var loadOp = &wire.LoadOp{
				CollectionName: token.Collection,
				WireName:       "UserTokenRequest",
				Collection:     lookupResults,
				Conditions:     loadConditions,
				Fields:         fieldsMap.getRequestFields(),
				Query:          true,
			}

			err := GetMetadataForLoad(ctx, loadOp, metadata, []*wire.LoadOp{loadOp}, adminSession, connection)
			if err != nil {
				return err
			}

			loadCollectionMetadata, err := metadata.GetCollection(token.Collection)
			if err != nil {
				return err
			}

			loadOp.AttachMetadataCache(metadata)

			// intentionally using session context and not adminSession - adminSession is used for permissions
			// but should not be considered to carry the active context (although it should be the same as session.Context())
			err = connection.Load(ctx, loadOp, adminSession)
			if err != nil {
				return err
			}

			template, err := wire.NewFieldChanges(token.Token, loadCollectionMetadata, metadata)
			if err != nil {
				return err
			}

			reasonTemplate, err := wire.NewFieldChanges(token.Reason, loadCollectionMetadata, metadata)
			if err != nil {
				return err
			}

			var tokenStrings []sess.TokenValue
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

func GenerateUserAccessTokens(ctx context.Context, connection wire.Connection, metadata *wire.MetadataCache, session *sess.Session) error {

	tokenMap := session.GetTokenMap()

	tokenDefs, err := getTokensForRequest(ctx, metadata, session, tokenMap)
	if err != nil {
		return err
	}

	err = HydrateTokenMap(ctx, tokenMap, tokenDefs, connection, metadata, session, false)
	if err != nil {
		return err
	}

	session.SetTokenMap(tokenMap)

	return nil
}

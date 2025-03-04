package systemdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/goutils"
	"github.com/thecloudmasters/uesio/pkg/meta"
	oauthlib "github.com/thecloudmasters/uesio/pkg/oauth2"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

// Return a list of Integrations with per-user access credentials,
// along with info about whether the current user has any access / refresh tokens for that integration yet,
// and if so, when the access token expires.
func runMyIntegrationCredentialsLoadBot(op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {
	// If the load op included workspace/site admin parameters, use these to adjust the context of our session
	if contextSession, err := datasource.GetContextSessionFromParams(op.Params, connection, session); err == nil {
		session = contextSession
	}
	// Load all existing integration credentials for the user
	userId := session.GetSiteUser().ID
	existingCreds, err := getAllIntegrationCredentialsForUser(
		userId, session, connection, op.Params)
	if err != nil {
		return err
	}
	// Build a map of existing creds by integration name
	existingCredsByIntegration, err := existingCreds.GroupByField("uesio/core.integration")
	if err != nil {
		return err
	}
	// Find all integrations with per-user credentials that the user has access to,
	// or just specific ones that they requested
	targetIntegrationNames := getTargetIntegrationNamesFromConditions(op.Conditions)
	integrationCollection, err := getAllPerUserIntegrationsUserHasAccessTo(session, connection, targetIntegrationNames)
	if err != nil {
		return err
	}
	// Construct a final list of myintegrationcredential records
	if err = integrationCollection.Loop(func(integrationItem meta.Item, index string) error {
		item := op.Collection.NewItem()
		integration := integrationItem.(*meta.Integration)
		integrationName := integration.GetKey()
		item.SetField(oauthlib.IntegrationField, integrationName)
		item.SetField(oauthlib.UserField, userId)
		// If we have an integration credential record already, use it to flesh out the rest of the fields
		if existingCred, isPresent := existingCredsByIntegration[integrationName]; isPresent {
			item.SetField("uesio/core.hasaccesstoken", hasStringField(existingCred, oauthlib.AccessTokenField))
			item.SetField("uesio/core.hasrefreshtoken", hasStringField(existingCred, oauthlib.RefreshTokenField))
			if idField, err := existingCred.GetField("uesio/core.id"); err == nil && idField != "" {
				item.SetField("uesio/core.id", idField)
			} else {
				item.SetField("uesio/core.id", integrationName)
			}
			if expiry, err := existingCred.GetField(oauthlib.AccessTokenExpirationField); err == nil {
				item.SetField("uesio/core.accesstokenexpiration", expiry)
			}
			if updatedAt, err := existingCred.GetField(commonfields.UpdatedAt); err == nil {
				item.SetField(commonfields.UpdatedAt, updatedAt)
			}
			if createdAt, err := existingCred.GetField(commonfields.CreatedAt); err == nil {
				item.SetField(commonfields.CreatedAt, createdAt)
			}
			if tokenType, err := existingCred.GetField(oauthlib.TokenTypeField); err == nil {
				item.SetField(oauthlib.TokenTypeField, tokenType)
			}
		} else {
			// Otherwise populate empty state values for all fields
			item.SetField("uesio/core.hasaccesstoken", false)
			item.SetField("uesio/core.hasrefreshtoken", false)
			item.SetField("uesio/core.id", integrationName)
		}
		op.Collection.AddItem(item)
		return nil
	}); err != nil {
		return err
	}

	return nil
}

func getTargetIntegrationNamesFromConditions(conditions []wire.LoadRequestCondition) []string {
	var integrationNames []string
	if len(conditions) < 1 {
		return integrationNames
	}
	for _, c := range conditions {
		if c.Field == oauthlib.IntegrationField {
			if c.Value != nil && c.Value != "" && (c.Operator == "EQ" || c.Operator == "") {
				if nameString, isString := c.Value.(string); isString {
					integrationNames = append(integrationNames, nameString)
				}
			} else if c.Values != nil && c.Operator == "IN" {
				if namesSlice, isStringSlice := goutils.StringSliceValue(c.Values); isStringSlice {
					integrationNames = append(integrationNames, namesSlice...)
				}
			}
		}
	}
	return integrationNames
}

func hasStringField(item meta.Item, fieldName string) bool {
	if val, err := item.GetField(fieldName); err == nil {
		return val != nil && val != ""
	}
	return false
}

func getAllPerUserIntegrationsUserHasAccessTo(session *sess.Session, connection wire.Connection, integrationKeys []string) (*meta.IntegrationCollection, error) {
	group := &meta.IntegrationCollection{}
	conditions := meta.BundleConditions{}
	// Eventually we could add other per-user authentication types to this list,
	// but currently there aren't any others.
	conditions["uesio/studio.authentication"] = []string{
		"OAUTH2_AUTHORIZATION_CODE",
	}
	uniqueNames := make(map[string]struct{})
	uniqueNamespaces := make(map[string]struct{})
	if len(integrationKeys) > 0 {
		for i := range integrationKeys {
			if namespace, name, err := meta.ParseKey(integrationKeys[i]); err == nil {
				uniqueNames[name] = struct{}{}
				uniqueNamespaces[namespace] = struct{}{}
			}
		}
	}
	// If we have unique namespaces to load from, do a more targeted load.
	if len(uniqueNames) > 0 {
		conditions["uesio/studio.name"] = goutils.MapKeys(uniqueNames)
		if err := bundle.LoadAllFromNamespaces(goutils.MapKeys(uniqueNamespaces), group, &bundlestore.GetAllItemsOptions{
			Conditions: conditions,
		}, session, connection); err != nil {
			return nil, errors.New("unable to load integrations: " + err.Error())
		}
	} else {
		if err := bundle.LoadAllFromAny(group, &bundlestore.GetAllItemsOptions{
			Conditions: conditions,
		}, session, connection); err != nil {
			return nil, errors.New("unable to load integrations: " + err.Error())
		}
	}
	return group, nil
}

func getAllIntegrationCredentialsForUser(userId string, session *sess.Session, connection wire.Connection, params map[string]interface{}) (*wire.Collection, error) {

	versionSession, err := datasource.EnterVersionContext("uesio/core", session, connection)
	if err != nil {
		return nil, errors.New("unable to enter version context")
	}

	collection := &wire.Collection{}
	newOp := &wire.LoadOp{
		CollectionName: oauthlib.IntegrationCredentialCollection,
		WireName:       "loadIntegrationCredentials",
		Collection:     collection,
		Conditions: []wire.LoadRequestCondition{
			{
				Field:    oauthlib.UserField,
				Value:    userId,
				Operator: "EQ",
			},
		},
		Fields: []wire.LoadRequestField{
			{ID: oauthlib.AccessTokenField},
			{ID: oauthlib.RefreshTokenField},
			{ID: oauthlib.TokenTypeField},
			{ID: oauthlib.AccessTokenExpirationField},
			{ID: oauthlib.IntegrationField},
			{ID: commonfields.CreatedAt},
			{ID: commonfields.UpdatedAt},
		},
		Query:   true,
		LoadAll: true,
		Params:  params,
	}

	err = datasource.LoadWithError(newOp, versionSession, &datasource.LoadOptions{
		Connection: connection,
	})
	if err != nil {
		return nil, err
	}
	return collection, nil
}

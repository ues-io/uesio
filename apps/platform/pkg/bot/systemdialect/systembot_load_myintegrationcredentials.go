package systemdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Return a list of Integrations with per-user access credentials,
// along with info about whether the current user has any access / refresh tokens for that integration yet,
// and if so, when the access token expires.
func runMyIntegrationCredentialsLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {
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
	// or just one if there is only one requested
	targetIntegrationName := getTargetIntegrationNameFromConditions(op.Conditions)
	integrationCollection, err := getAllPerUserIntegrationsUserHasAccessTo(session, connection, targetIntegrationName)
	if err != nil {
		return err
	}
	// Construct a final list of myintegrationcredential records
	if err = integrationCollection.Loop(func(integrationItem meta.Item, index string) error {
		item := op.Collection.NewItem()
		integration := integrationItem.(*meta.Integration)
		integrationName := integration.GetKey()
		item.SetField("uesio/core.integration", integrationName)
		item.SetField("uesio/core.user", userId)
		// If we have an integration credential record already, use it to flesh out the rest of the fields
		if existingCred, isPresent := existingCredsByIntegration[integrationName]; isPresent {
			item.SetField("uesio/core.hasaccesstoken", hasStringField(existingCred, "uesio/core.accesstoken"))
			item.SetField("uesio/core.hasrefreshtoken", hasStringField(existingCred, "uesio/core.refreshtoken"))
			if idField, err := existingCred.GetField("uesio/core.id"); err == nil && idField != "" {
				item.SetField("uesio/core.id", idField)
			} else {
				item.SetField("uesio/core.id", integrationName)
			}
			if expiry, err := existingCred.GetField("uesio/core.accesstokenexpiration"); err == nil {
				item.SetField("uesio/core.accesstokenexpiration", expiry)
			}
			if updatedAt, err := existingCred.GetField("uesio/core.updatedat"); err == nil {
				item.SetField("uesio/core.updatedat", updatedAt)
			}
			if createdAt, err := existingCred.GetField("uesio/core.createdat"); err == nil {
				item.SetField("uesio/core.createdat", createdAt)
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

func getTargetIntegrationNameFromConditions(conditions []adapt.LoadRequestCondition) string {
	name := ""
	if len(conditions) < 1 {
		return name
	}
	for _, c := range conditions {
		if c.Field == "uesio/core.integration" {
			if c.Value != nil && c.Value != "" {
				name = c.Value.(string)
			}
		}
		if name != "" {
			return name
		}
	}
	return name
}

func hasStringField(item meta.Item, fieldName string) bool {
	if val, err := item.GetField(fieldName); err == nil {
		return val != nil && val != ""
	}
	return false
}

func getAllPerUserIntegrationsUserHasAccessTo(session *sess.Session, connection adapt.Connection, integrationName string) (*meta.IntegrationCollection, error) {
	group := &meta.IntegrationCollection{}
	conditions := meta.BundleConditions{}
	// TODO: Eventually we need to support "IN" Bundle Conditions
	// and other per-user authentication types
	conditions["uesio/studio.authentication"] = "OAUTH2_AUTHORIZATION_CODE"
	if integrationName != "" {
		if _, name, err := meta.ParseKey(integrationName); err == nil {
			conditions["uesio/studio.name"] = name
			//conditions["uesio/studio.namespace"] = namespace
		}
	}
	// TO VERIFY: connection here can be nil?
	if err := bundle.LoadAllFromAny(group, conditions, session, connection); err != nil {
		return nil, errors.New("unable to load integrations: " + err.Error())
	}
	return group, nil
}

func getAllIntegrationCredentialsForUser(userId string, session *sess.Session, connection adapt.Connection, params map[string]string) (*adapt.Collection, error) {

	versionSession, err := datasource.EnterVersionContext("uesio/core", session, connection)
	if err != nil {
		return nil, errors.New("unable to enter version context")
	}

	collection := &adapt.Collection{}
	newOp := &adapt.LoadOp{
		CollectionName: "uesio/core.integrationcredential",
		WireName:       "loadIntegrationCredentials",
		Collection:     collection,
		Conditions: []adapt.LoadRequestCondition{
			{
				Field:    "uesio/core.user",
				Value:    userId,
				Operator: "EQ",
			},
		},
		Fields: []adapt.LoadRequestField{
			{ID: "uesio/core.accesstoken"},
			{ID: "uesio/core.refreshtoken"},
			{ID: "uesio/core.accesstokenexpiration"},
			{ID: "uesio/core.integration"},
			{ID: "uesio/core.createdat"},
			{ID: "uesio/core.updatedat"},
		},
		Query:   true,
		LoadAll: true,
		Params:  params,
	}

	_, err = datasource.Load([]*adapt.LoadOp{newOp}, versionSession, &datasource.LoadOptions{
		Connection: connection,
		Metadata:   connection.GetMetadata(),
	})
	if err != nil {
		return nil, err
	}
	return collection, nil
}

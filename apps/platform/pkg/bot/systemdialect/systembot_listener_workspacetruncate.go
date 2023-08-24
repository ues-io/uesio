package systemdialect

import (
	"errors"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func RunWorkspaceTruncateListenerBot(params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {

	tenantID := session.GetTenantID()

	if tenantID == "" {
		return nil, meta.NewParamError("required parameter not provided in session", "tenant id")
	}

	if tenantID == "site:uesio/studio:prod" {
		return nil, meta.NewBotAccessError("cannot truncate Studio site data")
	}

	if !session.GetSitePermissions().HasNamedPermission("uesio/studio.workspace_admin") {
		return nil, meta.NewBotAccessError("you must be a Studio workspace admin to truncate workspace data")
	}

	var err error

	handleTransactions := false

	if connection == nil {
		// If we have to create a connection, we also need to handle starting/stopping a transaction
		handleTransactions = true
		connection, err = datasource.GetPlatformConnection(nil, session, nil)
		if err != nil {
			return nil, errors.New("unable to obtain a connection to perform the requested operation")
		}
		err = connection.BeginTransaction()
		if err != nil {
			return nil, err
		}
	}

	err = connection.TruncateTenantData(tenantID)
	if err != nil {
		return nil, err
	}

	if handleTransactions {
		err = connection.CommitTransaction()
		if err != nil {
			return nil, err
		}
	}

	return nil, nil
}

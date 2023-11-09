package truncate

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func TruncateWorkspaceData(tenantID string, session *sess.Session) error {

	connection, err := datasource.GetPlatformConnection(nil, session, nil)
	if err != nil {
		return err
	}

	if tenantID == "" {
		return meta.NewParamError("required parameter not provided in session", "tenant id")
	}

	if tenantID == "site:uesio/studio:prod" {
		return meta.NewBotAccessError("cannot truncate Studio site data")
	}

	if !session.GetSitePermissions().HasNamedPermission("uesio/studio.workspace_admin") {
		return meta.NewBotAccessError("you must be a Studio workspace admin to truncate workspace data")
	}
	err = connection.BeginTransaction()
	if err != nil {
		return errors.New("unable to truncate workspace data: could not create a transaction")
	}
	err = connection.TruncateTenantData(tenantID)
	if err != nil {
		_ = connection.RollbackTransaction()
		return errors.New("unable to truncate workspace data: " + err.Error())
	}
	err = connection.CommitTransaction()
	if err != nil {
		return errors.New("unable to truncate workspace data: could not commit transaction")
	}
	return nil
}

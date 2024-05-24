package truncate

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func TruncateWorkspaceData(tenantID string, session *sess.Session) error {

	connection, err := datasource.GetPlatformConnection(nil, session, nil)
	if err != nil {
		return err
	}

	if tenantID == "" {
		return exceptions.NewInvalidParamException("required parameter not provided in session", "tenant id")
	}

	if tenantID == "site:uesio/studio:prod" {
		return exceptions.NewForbiddenException("cannot truncate Studio site data")
	}

	if !session.GetSitePermissions().HasNamedPermission(constant.WorkspaceAdminPerm) {
		return exceptions.NewForbiddenException("you must be a Studio workspace admin to truncate workspace data")
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

package truncate

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func TruncateWorkspaceData(tenantID string, session *sess.Session) error {

	if tenantID == "" {
		return exceptions.NewInvalidParamException("required parameter not provided in session", "tenant id")
	}

	if tenantID == "site:uesio/studio:prod" {
		return exceptions.NewForbiddenException("cannot truncate studio site data")
	}

	if !session.GetSitePermissions().HasNamedPermission(constant.WorkspaceAdminPerm) {
		return exceptions.NewForbiddenException("you must be a studio workspace admin to truncate workspace data")
	}

	err := datasource.WithTransaction(session, nil, func(conn wire.Connection) error {
		return conn.TruncateTenantData(session.Context(), tenantID)
	})
	if err != nil {
		return fmt.Errorf("unable to truncate workspace data: %w", err)
	}

	return nil
}

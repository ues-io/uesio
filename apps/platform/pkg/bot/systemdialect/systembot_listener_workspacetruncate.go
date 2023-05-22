package systemdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runWorkspaceTruncateListenerBot(params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {

	tenantID := session.GetTenantID()

	if tenantID == "" {
		return nil, errors.New("Error truncating, missing tenant id")
	}

	if tenantID == "site:uesio/studio:prod" {
		err := errors.New("cannot truncate Studio data")
		return nil, err
	}

	connection, err := datasource.GetPlatformConnection(nil, session, nil)
	if err != nil {
		return nil, err
	}

	return nil, connection.Truncate(tenantID)
}

package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/truncate"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func RunWorkspaceTruncateListenerBot(params map[string]interface{}, connection wire.Connection, session *sess.Session) (map[string]interface{}, error) {

	appID, err := getRequiredParameter(params, "app")
	if err != nil {
		return nil, err
	}

	workspaceName, err := getRequiredParameter(params, "workspaceName")
	if err != nil {
		return nil, err
	}

	tenantID := sess.MakeWorkspaceTenantID(appID + ":" + workspaceName)

	return nil, truncate.TruncateWorkspaceData(tenantID, session)
}

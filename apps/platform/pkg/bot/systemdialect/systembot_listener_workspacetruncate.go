package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/truncate"
)

func RunWorkspaceTruncateListenerBot(params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {

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

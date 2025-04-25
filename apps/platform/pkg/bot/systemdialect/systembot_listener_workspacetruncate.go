package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/param"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/truncate"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runWorkspaceTruncateListenerBot(params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error) {

	appID, err := param.GetRequiredString(params, "app")
	if err != nil {
		return nil, err
	}

	workspaceName, err := param.GetRequiredString(params, "workspaceName")
	if err != nil {
		return nil, err
	}

	tenantID := sess.MakeWorkspaceTenantID(appID + ":" + workspaceName)

	return nil, truncate.TruncateWorkspaceData(tenantID, session)
}

package systemdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/truncate"
)

func RunWorkspaceTruncateListenerBot(params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {

	workspaceUniqueKey := ""
	if workspaceUniqueKeyParam, hasWorkspaceUniqueKeyParam := params["workspaceUniqueKey"]; hasWorkspaceUniqueKeyParam {
		if stringValue, isString := workspaceUniqueKeyParam.(string); isString {
			workspaceUniqueKey = stringValue
		}
	}

	if workspaceUniqueKey == "" {
		return nil, errors.New("cannot create truncate a workspace without an workspace UniqueKey as parameter")
	}

	tenantID := sess.MakeWorkspaceTenantID(workspaceUniqueKey)

	return nil, truncate.TruncateWorkspaceData(tenantID, session)
}

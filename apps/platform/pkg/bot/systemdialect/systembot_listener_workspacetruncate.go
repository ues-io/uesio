package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/truncate"
)

func RunWorkspaceTruncateListenerBot(_ map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {
	return nil, truncate.TruncateWorkspaceData(session)
}

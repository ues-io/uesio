package systemdialect

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runRecentMetadataLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	workspace := op.Params["workspacename"]
	if workspace == "" {
		return errors.New("No Workspace Name or Site Name Parameter Provided")
	}

	app := op.Params["app"]
	if app == "" {
		return errors.New("No App Parameter Provided")
	}

	workspaceKey := fmt.Sprintf("%s:%s", app, workspace)
	err := datasource.AddWorkspaceContextByKey(workspaceKey, session, connection)
	if err != nil {
		return err
	}

	return connection.GetRecentMetadata(op, session)

}

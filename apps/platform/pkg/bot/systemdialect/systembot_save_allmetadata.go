package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runStudioMetadataSaveBot(op *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	workspaceID, err := GetWorkspaceIDFromParams(op.Params, connection, session)
	if err != nil {
		return err
	}

	err = op.LoopChanges(func(change *adapt.ChangeItem) error {
		return change.SetField("uesio/studio.workspace", &adapt.Item{
			adapt.ID_FIELD: workspaceID,
		})
	})
	if err != nil {
		return err
	}

	return datasource.SaveOp(op, connection, session)

}

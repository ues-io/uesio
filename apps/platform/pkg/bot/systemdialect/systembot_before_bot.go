package systemdialect

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runBotBeforeSaveBot(ctx context.Context, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	// early return if we only have deletes
	if !request.HasChanges() {
		return nil
	}

	wsAccessResult := datasource.RequestWorkspaceWriteAccess(ctx, request.Params, connection, session)
	if !wsAccessResult.HasWriteAccess() {
		return wsAccessResult.Error()
	}
	workspaceID := wsAccessResult.GetWorkspaceID()

	depMap := wire.MetadataDependencyMap{}

	err := request.LoopChanges(func(change *wire.ChangeItem) error {

		botType, err := requireValue(change, "uesio/studio.type")
		if err != nil {
			return err
		}

		if _, err = requireValue(change, "uesio/studio.dialect"); err != nil {
			return err
		}

		switch botType {
		case "LISTENER", "LOAD", "SAVE":

		case "AFTERSAVE", "BEFORESAVE":
			err := depMap.AddRequired(change, "collection", "uesio/studio.collection")
			if err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return err
	}

	items, err := depMap.GetItems()
	if err != nil {
		return err
	}

	return checkValidItems(ctx, workspaceID, items, session, connection)

}

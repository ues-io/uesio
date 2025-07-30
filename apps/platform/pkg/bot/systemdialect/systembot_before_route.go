package systemdialect

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runRouteBeforeSaveBot(ctx context.Context, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	// Early return if we have only deletes, no changes
	if !request.HasChanges() {
		return nil
	}

	depMap := wire.MetadataDependencyMap{}

	wsAccessResult := datasource.RequestWorkspaceWriteAccess(ctx, request.Params, connection, session)
	if !wsAccessResult.HasWriteAccess() {
		return wsAccessResult.Error()
	}

	err := request.LoopChanges(func(change *wire.ChangeItem) error {
		routeType, _ := change.GetFieldAsString("uesio/studio.type")
		switch routeType {
		case "bot":
			return depMap.AddRequired(change, "bot", "uesio/studio.bot")
		case "redirect":
			redirect, _ := change.GetFieldAsString("uesio/studio.redirect")
			if redirect == "" {
				return exceptions.NewBadRequestException("redirect field is required", nil)
			}
			return nil
		default:
			// View
			if err := depMap.AddOptional(change, "collection", "uesio/studio.collection"); err != nil {
				return err
			}
			if err := depMap.AddRequired(change, "view", "uesio/studio.view"); err != nil {
				return err
			}
			return depMap.AddOptional(change, "theme", "uesio/studio.theme")
		}
	})
	if err != nil {
		return err
	}

	items, err := depMap.GetItems()
	if err != nil {
		return err
	}

	return checkValidItems(ctx, wsAccessResult.GetWorkspaceID(), items, session, connection)

}

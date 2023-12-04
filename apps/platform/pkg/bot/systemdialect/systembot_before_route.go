package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runRouteBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	// Early return if we have only deletes, no changes
	if !request.HasChanges() {
		return nil
	}

	depMap := MetadataDependencyMap{}

	wsAccessResult := datasource.RequestWorkspaceWriteAccess(request.Params, connection, session)
	if !wsAccessResult.HasWriteAccess() {
		return wsAccessResult.Error()
	}

	err := request.LoopChanges(func(change *adapt.ChangeItem) error {

		routeType, _ := change.GetFieldAsString("uesio/studio.type")
		if routeType != "redirect" {
			if err := depMap.AddOptional(change, "collection", "uesio/studio.collection"); err != nil {
				return err
			}
			if err := depMap.AddRequired(change, "view", "uesio/studio.view"); err != nil {
				return err
			}
			return depMap.AddOptional(change, "theme", "uesio/studio.theme")
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

	return checkValidItems(wsAccessResult.GetWorkspaceID(), items, session, connection)

}

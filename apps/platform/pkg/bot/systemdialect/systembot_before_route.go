package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runRouteBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	depMap := MetadataDependencyMap{}

	workspaceID, err := GetWorkspaceIDFromParams(request.Params, connection, session)
	if err != nil {
		return err
	}

	err = request.LoopChanges(func(change *adapt.ChangeItem) error {

		routeType, _ := change.GetFieldAsString("uesio/studio.type")
		if routeType != "redirect" {
			err = depMap.AddOptional(change, "collection", "uesio/studio.collection")
			if err != nil {
				return err
			}

			err = depMap.AddRequired(change, "view", "uesio/studio.view")
			if err != nil {
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

	return checkValidItems(workspaceID, items, session, connection)

}

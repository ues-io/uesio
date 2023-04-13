package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runRouteBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	depMap := MetadataDependencyMap{}

	var workspaceID string

	err := request.LoopChanges(func(change *adapt.ChangeItem) error {
		err := checkWorkspaceID(&workspaceID, change)
		if err != nil {
			return err
		}

		err = depMap.AddOptional(change, "collection", "uesio/studio.collection")
		if err != nil {
			return err
		}

		err = depMap.AddRequired(change, "view", "uesio/studio.view")
		if err != nil {
			return err
		}

		return depMap.AddRequired(change, "theme", "uesio/studio.theme")
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

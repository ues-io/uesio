package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runBotBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	depMap := MetadataDependencyMap{}
	var workspaceID string

	err := request.LoopChanges(func(change *adapt.ChangeItem) error {
		err := checkWorkspaceID(&workspaceID, change)
		if err != nil {
			return err
		}

		btype, err := requireValue(change, "uesio/studio.type")
		if err != nil {
			return err
		}

		_, err = requireValue(change, "uesio/studio.dialect")
		if err != nil {
			return err
		}

		switch btype {
		case "LISTENER":

		case "AFTERSAVE", "BEFORESAVE":
			depMap.AddRequired(change, "collection", "uesio/studio.collection")
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

	return checkValidItems(workspaceID, items, session, connection)

}

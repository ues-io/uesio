package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runBotBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	collectionKeys := map[string]bool{}
	allKeys := map[string]map[string]bool{}
	var workspaceID string

	err := request.LoopChanges(func(change *adapt.ChangeItem) error {
		err := checkWorkspaceID(&workspaceID, change)
		if err != nil {
			return err
		}

		btype, err := change.GetFieldAsString("uesio/studio.type")
		if err != nil {
			return err
		}

		if err = isRequired(btype, "Bot", "Type"); err != nil {
			return err
		}

		dialect, err := change.GetFieldAsString("uesio/studio.dialect")
		if err != nil {
			return err
		}

		if err = isRequired(dialect, "Bot", "Dialect"); err != nil {
			return err
		}

		switch btype {
		case "LISTENER":
			change.SetField("uesio/studio.collection", "uesio/studio.listener")

		case "AFTERSAVE":
			collection, err := change.GetFieldAsString("uesio/studio.collection")
			if err != nil {
				return err
			}
			if err := isRequired(collection, "Bot", "Collection"); err != nil {
				return err
			}

			collectionKeys[collection] = true

		case "BEFORESAVE":
			collection, err := change.GetFieldAsString("uesio/studio.collection")
			if err != nil {
				return err
			}
			if err := isRequired(collection, "Bot", "Collection"); err != nil {
				return err
			}

			collectionKeys[collection] = true
		}

		return nil
	})
	if err != nil {
		return err
	}

	allKeys["collection"] = collectionKeys

	items, err := getAllItems(allKeys)
	if err != nil {
		return err
	}

	return checkValidItems(workspaceID, items, session, connection)

}

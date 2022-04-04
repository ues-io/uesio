package datasource

import (
	"errors"

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

		collection, err := change.GetFieldAsString("uesio/studio.collection")
		if err != nil {
			return err
		}

		err = botTypeSC(btype, collection)
		if err != nil {
			return err
		}

		if collection != "" {
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

func botTypeSC(botType, collection string) error {

	switch botType {
	case "LISTENER":
		if collection != "" {
			return errors.New("Bot: The collection field is not required for bots of type Listener")
		}
	case "AFTERSAVE":
		if err := isRequired(collection, "Bot", "Collection"); err != nil {
			return err
		}
	case "BEFORESAVE":
		if err := isRequired(collection, "Bot", "Collection"); err != nil {
			return err
		}
	}

	return nil

}

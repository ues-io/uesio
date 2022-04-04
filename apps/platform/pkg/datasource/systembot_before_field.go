package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runFieldBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	collectionKeys := map[string]bool{}
	allKeys := map[string]map[string]bool{}
	var workspaceID string

	err := request.LoopChanges(func(change *adapt.ChangeItem) error {
		err := checkWorkspaceID(&workspaceID, change)
		if err != nil {
			return err
		}

		ftype, err := change.GetFieldAsString("uesio/studio.type")
		if err != nil || ftype == "" {
			return errors.New("Field: Type is required")
		}
		if ftype == "REFERENCE" {
			referencedCollection, _ := change.GetFieldAsString("uesio/studio.reference->uesio/studio.collection")
			if referencedCollection == "" {
				return errors.New("Field: Referenced Collection is required")
			}
			collectionKeys[referencedCollection] = true
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

func fieldTypeSC(botType, collection string) error {

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

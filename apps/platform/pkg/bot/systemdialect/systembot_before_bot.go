package systemdialect

import (
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runBotBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	depMap := MetadataDependencyMap{}

	workspaceID, err := GetWorkspaceIDFromParams(request.Params, connection, session)
	if err != nil {
		return err
	}

	err = request.LoopChanges(func(change *adapt.ChangeItem) error {

		botType, err := requireValue(change, "uesio/studio.type")
		if err != nil {
			return err
		}

		if _, err = requireValue(change, "uesio/studio.dialect"); err != nil {
			return err
		}

		if meta.IsBotTypeWithCollection(strings.ToLower(botType)) {
			if err = depMap.AddRequired(change, "collection", "uesio/studio.collection"); err != nil {
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

package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runRouteBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	collectionKeys := map[string]bool{}
	viewKeys := map[string]bool{}
	themeKeys := map[string]bool{}
	allKeys := map[string]map[string]bool{}

	var workspaceID string

	err := request.LoopChanges(func(change *adapt.ChangeItem) error {
		err := checkWorkspaceID(&workspaceID, change)
		if err != nil {
			return err
		}

		collection, _ := change.GetFieldAsString("uesio/studio.collection")

		if collection != "" {
			collectionKeys[collection] = true
		}

		view, err := change.GetFieldAsString("uesio/studio.view")
		if err != nil {
			return err
		}
		if view != "" {
			viewKeys[view] = true
		}
		theme, err := change.GetFieldAsString("uesio/studio.theme")
		if err != nil {
			return err
		}
		if theme != "" {
			themeKeys[theme] = true
		}

		return nil
	})
	if err != nil {
		return err
	}

	allKeys["collection"] = collectionKeys
	allKeys["view"] = viewKeys
	allKeys["theme"] = themeKeys

	items, err := getAllItems(allKeys)
	if err != nil {
		return err
	}

	return checkValidItems(workspaceID, items, session, connection)

}

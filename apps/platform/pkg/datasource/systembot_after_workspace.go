package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runWorkspaceAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	newDeps := adapt.Collection{}
	// Install the uesio bundle when you create a new workspace
	request.LoopInserts(func(change *adapt.ChangeItem) error {
		workspaceID, err := change.GetFieldAsString(adapt.ID_FIELD)
		if err != nil {
			return err
		}

		newDeps = append(newDeps, &adapt.Item{
			"uesio/studio.app": map[string]interface{}{
				"uesio/core.uniquekey": "uesio/core",
			},
			"uesio/studio.bundle": map[string]interface{}{
				"uesio/core.uniquekey": "uesio/core:0:0:1",
			},
			"uesio/studio.workspace": map[string]interface{}{
				"uesio/core.id": workspaceID,
			},
		}, &adapt.Item{
			"uesio/studio.app": map[string]interface{}{
				"uesio/core.uniquekey": "uesio/io",
			},
			"uesio/studio.bundle": map[string]interface{}{
				"uesio/core.uniquekey": "uesio/io:0:0:1",
			},
			"uesio/studio.workspace": map[string]interface{}{
				"uesio/core.id": workspaceID,
			},
		})
		return nil
	})
	return SaveWithOptions([]SaveRequest{
		{
			Collection: "uesio/studio.bundledependency",
			Wire:       "defaultapps",
			Changes:    &newDeps,
		},
	}, session, GetConnectionSaveOptions(connection))

}

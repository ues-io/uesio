package systemdialect

import (
	"errors"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"strings"
)

func runWorkspaceAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	var err error
	newDeps := adapt.Collection{}
	// Install the uesio bundle when you create a new workspace
	err = request.LoopInserts(func(change *adapt.ChangeItem) error {
		workspaceID, err := change.GetFieldAsString(adapt.ID_FIELD)
		if err != nil {
			return err
		}

		newDeps = append(newDeps, &adapt.Item{
			"uesio/studio.app": map[string]interface{}{
				"uesio/core.uniquekey": "uesio/builder",
			},
			"uesio/studio.bundle": map[string]interface{}{
				"uesio/core.uniquekey": "uesio/builder:0:0:1",
			},
			"uesio/studio.workspace": map[string]interface{}{
				"uesio/core.id": workspaceID,
			},
		}, &adapt.Item{
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
	if err != nil {
		return err
	}
	if len(newDeps) > 0 {
		depsSaveErr := datasource.SaveWithOptions([]datasource.SaveRequest{
			{
				Collection: "uesio/studio.bundledependency",
				Wire:       "defaultapps",
				Changes:    &newDeps,
				Options: &adapt.SaveOptions{
					Upsert: true,
				},
			},
		}, session, datasource.GetConnectionSaveOptions(connection))
		if depsSaveErr != nil {
			return depsSaveErr
		}
	}

	// If we are deleting workspaces, also truncate their data
	err = request.LoopDeletes(func(change *adapt.ChangeItem) error {
		workspaceUniqueKey, innerErr := change.GetOldFieldAsString(adapt.UNIQUE_KEY_FIELD)
		if innerErr != nil {
			return innerErr
		}
		if workspaceUniqueKey == "" {
			return errors.New("unable to get workspace unique key, cannot truncate data")
		}

		appFullName := strings.Split(workspaceUniqueKey, ":")[0]
		appNameParts := strings.Split(appFullName, "/")
		workspace := &meta.Workspace{
			BuiltIn: meta.BuiltIn{
				UniqueKey: workspaceUniqueKey,
			},
			App: &meta.App{
				Name:     appNameParts[0],
				FullName: appFullName,
				BuiltIn: meta.BuiltIn{
					UniqueKey: appFullName,
				},
			},
		}
		session.SetWorkspaceSession(sess.NewWorkspaceSession(
			workspace,
			session.GetSiteUser(),
			"uesio/system.admin",
			meta.GetAdminPermissionSet(),
		))
		if innerErr != nil {
			return innerErr
		}
		_, truncateErr := RunWorkspaceTruncateListenerBot(nil, connection, session)
		if truncateErr != nil {
			return truncateErr
		}
		session.SetWorkspaceSession(nil)
		return nil
	})
	if err != nil {
		return err
	}
	return nil
}

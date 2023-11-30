package systemdialect

import (
	"encoding/json"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/workspacebundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runStudioMetadataSaveBot(op *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	// Extract app and workspace from params
	workspaceID, err := GetWorkspaceIDFromParams(op.Params, connection, session)
	if err != nil {
		return err
	}
	appName := op.Params["app"]
	var changedMetadataItemKeys []string

	if err = op.LoopChanges(func(change *adapt.ChangeItem) error {
		return change.SetField("uesio/studio.workspace", &adapt.Item{
			adapt.ID_FIELD: workspaceID,
		})
	}); err != nil {
		return err
	}

	if err = datasource.SaveOp(op, connection, session); err != nil {
		return err
	}

	// Invalidate our metadata caches - now that we've saved, UniqueKey should be populated
	if err = op.LoopChanges(func(change *adapt.ChangeItem) error {
		changedMetadataItemKeys = append(changedMetadataItemKeys, change.UniqueKey)
		return nil
	}); err != nil {
		return err
	}

	if len(changedMetadataItemKeys) < 1 {
		return nil
	}

	// We already verified that we have a workspace id,
	// but we MUST also know the context app name in order to achieve cache invalidation,
	// so if we do NOT have this yet (which ideally should never happen), we will need to query for it
	if appName == "" {
		workspace, err := datasource.QueryWorkspaceForWrite(workspaceID, adapt.ID_FIELD, session, connection)
		if err != nil {
			return err
		}
		appName = workspace.GetAppFullName()
	}

	message := &workspacebundlestore.WorkspaceMetadataChange{
		AppName:        appName,
		WorkspaceID:    workspaceID,
		CollectionName: op.Metadata.GetFullName(),
		ChangedItems:   changedMetadataItemKeys,
	}
	messagePayload, err := json.Marshal(message)
	if err != nil {
		return errors.New("unable to serialize workspace metadata changes cache key")
	}
	return connection.Publish(workspacebundlestore.WorkspaceMetadataChangesChannel, string(messagePayload))

}

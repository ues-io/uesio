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

	// Get the workspace ID from params, and verify that the user performing the query
	// has write access to the requested workspace
	wsAccessResult := datasource.RequestWorkspaceWriteAccess(op.Params, connection, session)
	if !wsAccessResult.HasWriteAccess() {
		return wsAccessResult.Error()
	}

	var changedMetadataItemKeys []string

	if err := op.LoopChanges(func(change *adapt.ChangeItem) error {
		return change.SetField("uesio/studio.workspace", &adapt.Item{
			adapt.ID_FIELD: wsAccessResult.GetWorkspaceID(),
		})
	}); err != nil {
		return err
	}

	if err := datasource.SaveOp(op, connection, session); err != nil {
		return err
	}

	// Invalidate our metadata caches - now that we've saved, UniqueKey should be populated
	if err := op.LoopChanges(func(change *adapt.ChangeItem) error {
		changedMetadataItemKeys = append(changedMetadataItemKeys, change.UniqueKey)
		return nil
	}); err != nil {
		return err
	}

	if len(changedMetadataItemKeys) < 1 {
		return nil
	}

	message := &workspacebundlestore.WorkspaceMetadataChange{
		AppName:        wsAccessResult.GetAppName(),
		WorkspaceID:    wsAccessResult.GetWorkspaceID(),
		CollectionName: op.Metadata.GetFullName(),
		ChangedItems:   changedMetadataItemKeys,
	}
	messagePayload, err := json.Marshal(message)
	if err != nil {
		return errors.New("unable to serialize workspace metadata changes cache key")
	}
	return connection.Publish(workspacebundlestore.WorkspaceMetadataChangesChannel, string(messagePayload))

}

package systemdialect

import (
	"encoding/json"
	"errors"
	"log/slog"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/workspacebundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// In my testing with the CRM app, the variable metadata key size can sway the total size by several 100 to 1000 bytes,
// so just to err on the cautious size, sticking with a number that averages around 4K
// (which is about half of the Postgres NOTIFY 8K limit)
const metadataItemsChunkSize = 90

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

	totalChangedKeys := len(changedMetadataItemKeys)
	if totalChangedKeys < 1 {
		return nil
	}

	// Chunk the messages to avoid hitting the max Postgres NOTIFY size limit
	for i := 0; i < totalChangedKeys; i += metadataItemsChunkSize {
		end := i + metadataItemsChunkSize
		if end > totalChangedKeys {
			end = totalChangedKeys
		}
		messagePayload, err := json.Marshal(&workspacebundlestore.WorkspaceMetadataChange{
			AppName:        wsAccessResult.GetAppName(),
			WorkspaceID:    wsAccessResult.GetWorkspaceID(),
			CollectionName: op.Metadata.GetFullName(),
			ChangedItems:   changedMetadataItemKeys[i:end],
		})
		if err != nil {
			return errors.New("unable to serialize workspace metadata changes cache key")
		}
		if err = connection.Publish(workspacebundlestore.WorkspaceMetadataChangesChannel, string(messagePayload)); err != nil {
			slog.Error("unable to invalidate workspace cache: " + err.Error())
			return errors.New("unable to invalidate workspace cache")
		}
	}
	return nil
}

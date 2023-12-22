package systemdialect

import (
	"encoding/json"
	"errors"
	"log/slog"
	"os"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/bundlestore/workspacebundlestore"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

// In my testing with the CRM app, the variable metadata key size can sway the total size by several 100 to 1000 bytes,
// so just to err on the cautious size, sticking with a number that averages around 1K
// (which is about 1/8 of the Postgres NOTIFY 8K limit).
// We tried 4K (~90) and were seeing errors in Prod.
const defaultMetadataItemsChunkSize = 20

var maxItemsPerChunk int

func init() {
	if maxItemsPerChunkStr := os.Getenv("UESIO_WORKSPACE_CACHE_INVALIDATION_ITEMS_CHUNK"); maxItemsPerChunkStr != "" {
		if intVal, err := strconv.Atoi(maxItemsPerChunkStr); err != nil {
			maxItemsPerChunk = intVal
		}
	}
	if maxItemsPerChunk == 0 {
		maxItemsPerChunk = defaultMetadataItemsChunkSize
	}
}

func runStudioMetadataSaveBot(op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	// Get the workspace ID from params, and verify that the user performing the query
	// has write access to the requested workspace
	wsAccessResult := datasource.RequestWorkspaceWriteAccess(op.Params, connection, session)
	if !wsAccessResult.HasWriteAccess() {
		return wsAccessResult.Error()
	}

	var changedMetadataItemKeys []string

	if !wsAccessResult.IsSiteAdmin() {
		if err := op.LoopChanges(func(change *wire.ChangeItem) error {
			return change.SetField("uesio/studio.workspace", &wire.Item{
				commonfields.Id: wsAccessResult.GetWorkspaceID(),
			})
		}); err != nil {
			return err
		}
	}

	if err := datasource.SaveOp(op, connection, session); err != nil {
		return err
	}

	// Invalidate our metadata caches - now that we've saved, UniqueKey should be populated
	if err := op.LoopChanges(func(change *wire.ChangeItem) error {
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
	for i := 0; i < totalChangedKeys; i += maxItemsPerChunk {
		end := i + maxItemsPerChunk
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

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
	workspaceName := op.Params["workspacename"]
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

	if appName == "" || workspaceName == "" || len(changedMetadataItemKeys) < 1 {
		return nil
	}

	message := &workspacebundlestore.WorkspaceMetadataChange{
		AppName:        appName,
		WorkspaceName:  workspaceID,
		CollectionName: op.Metadata.GetFullName(),
		ChangedItems:   changedMetadataItemKeys,
	}
	messagePayload, err := json.Marshal(message)
	if err != nil {
		return errors.New("unable to serialize workspace metadata changes cache key")
	}
	return connection.Publish(workspacebundlestore.WorkspaceMetadataChangesChannel, string(messagePayload))

}

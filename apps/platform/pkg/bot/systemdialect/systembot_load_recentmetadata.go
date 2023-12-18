package systemdialect

import (
	"errors"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

//This is a short & temporary version for the CUG
//like this we have controll of what we show in the recent table
//until we create all the routeassignments in the studio

var supportedCollections = []string{
	"uesio/studio.collection",
	"uesio/studio.view",
	"uesio/studio.profile",
	"uesio/studio.permissionset",
	"uesio/studio.route",
	"uesio/studio.selectlist",
	"uesio/studio.file",
	"uesio/studio.label",
	"uesio/studio.theme",
}

// intercepts the collection uesio/studio.recentmetadata & enhances the LoadOp
// Add the required metadata to complete the operation
func runRecentMetadataLoadBot(op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {

	workspace := op.Params["workspacename"]
	if workspace == "" {
		return errors.New("no workspace name parameter provided")
	}

	app := op.Params["app"]
	if app == "" {
		return errors.New("no app parameter provided")
	}

	workspaceKey := fmt.Sprintf("%s:%s", app, workspace)

	// We need to obtain the workspace id in order to have a condition on the uesio/studio.workspace field,
	// which contains the UUID of the workspace associated with studio data.
	inContextSession, err := datasource.AddWorkspaceContextByKey(workspaceKey, session, connection)
	if err != nil {
		return err
	}

	workspaceID := inContextSession.GetWorkspaceID()

	if workspaceID == "" {
		return errors.New("unable to retrieve recent metadata, workspace id is missing")
	}

	var fields = []wire.LoadRequestField{
		{ID: "uesio/studio.name"},
		{ID: "uesio/studio.label"},
		{ID: "uesio/studio.workspace"},
		{ID: "uesio/core.collection"},
		{ID: "uesio/core.updatedby", Fields: []wire.LoadRequestField{
			{
				ID: "uesio/core.firstname",
			},
			{
				ID: "uesio/core.lastname",
			},
			{
				ID: "uesio/core.language",
			},
			{
				ID: "uesio/core.picture",
			},
		}},
		{ID: "uesio/core.updatedat"},
		{ID: "uesio/core.uniquekey"},
	}

	newOp := &wire.LoadOp{
		CollectionName: op.CollectionName,
		WireName:       op.WireName,
		View:           op.View,
		Collection:     op.Collection,
		Conditions: []wire.LoadRequestCondition{
			{
				Field:    "uesio/studio.workspace",
				Value:    workspaceID,
				Operator: "EQ",
			},
			{
				Field:    "uesio/studio.name",
				Value:    nil,
				Operator: "NOT_EQ",
			},
			{
				Field:    "uesio/core.collection",
				Operator: "IN",
				Values:   supportedCollections,
			},
		},
		Fields: fields,
		Order: []wire.LoadRequestOrder{{
			Field: "uesio/core.updatedat",
			Desc:  true,
		}},
		Query:     true,
		BatchSize: 20,
	}

	metadata := connection.GetMetadata()

	recentmetadataCollectionMetadata, err := metadata.GetCollection("uesio/studio.recentmetadata")
	if err != nil {
		return err
	}

	recentmetadataCollectionMetadata.SetField(&wire.FieldMetadata{
		Name:       "name",
		Namespace:  "uesio/studio",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "TEXT",
		Label:      "Name",
	})
	recentmetadataCollectionMetadata.SetField(&wire.FieldMetadata{
		Name:       "label",
		Namespace:  "uesio/studio",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "TEXT",
		Label:      "Label",
	})
	recentmetadataCollectionMetadata.SetField(&wire.FieldMetadata{
		Name:       "workspace",
		Namespace:  "uesio/studio",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "TEXT",
		Label:      "Workspace",
	})
	recentmetadataCollectionMetadata.SetField(&wire.FieldMetadata{
		Name:       "dynamiccollection",
		Namespace:  "uesio/core",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "TEXT",
		Label:      "Dynamic Collection",
	})

	// We need to query with the original session
	err = connection.Load(newOp, session)
	if err != nil {
		return err
	}

	return newOp.Collection.Loop(func(item meta.Item, index string) error {
		collection, err := item.GetField("uesio/core.collection")
		if err != nil {
			return err
		}

		collectionValue, ok := collection.(string)
		if !ok {
			return errors.New("invalid collection value")
		}

		_, collectionName, err := meta.ParseKey(collectionValue)
		if err != nil {
			return err
		}

		name, err := item.GetField("uesio/studio.name")
		if err != nil {
			return err
		}

		label, _ := item.GetField("uesio/studio.label")
		if label == nil || label == "" {
			item.SetField("uesio/studio.label", name)
		}

		err = item.SetField("uesio/core.dynamiccollection", meta.METADATA_NAME_MAP[strings.ToUpper(collectionName)])
		if err != nil {
			return err
		}
		return nil
	})

}

package systemdialect

import (
	"errors"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

//intercepts the collection uesio/studio.recentmetadata & enhances the LoadOp
//Add the required metadata to complete the operation
func runRecentMetadataLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	workspace := op.Params["workspacename"]
	if workspace == "" {
		return errors.New("no workspace name parameter provided")
	}

	app := op.Params["app"]
	if app == "" {
		return errors.New("no app parameter provided")
	}

	workspaceKey := fmt.Sprintf("%s:%s", app, workspace)

	//This creates a copy of the session
	inContextSession := session.RemoveWorkspaceContext()

	err := datasource.AddWorkspaceContextByKey(workspaceKey, session, connection)
	if err != nil {
		return err
	}

	workspaceID := session.GetWorkspaceID()

	if workspaceID == "" {
		return errors.New("unable to retrieve recent metadata, workspace id is missing")
	}

	var fields = []adapt.LoadRequestField{
		{ID: "uesio/studio.name"},
		{ID: "uesio/studio.workspace"},
		{ID: "uesio/core.collection"},
		{ID: "uesio/core.updatedby", Fields: []adapt.LoadRequestField{
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

	newOp := &adapt.LoadOp{
		CollectionName: op.CollectionName,
		WireName:       op.WireName,
		View:           op.View,
		Collection:     op.Collection,
		Conditions: []adapt.LoadRequestCondition{
			{
				Field: "uesio/studio.workspace",
				Value: workspaceID,
			},
		},
		Fields: fields,
		Order: []adapt.LoadRequestOrder{{
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

	recentmetadataCollectionMetadata.SetField(&adapt.FieldMetadata{
		Name:       "name",
		Namespace:  "uesio/studio",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "TEXT",
		Label:      "Name",
	})

	recentmetadataCollectionMetadata.SetField(&adapt.FieldMetadata{
		Name:       "workspace",
		Namespace:  "uesio/studio",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "TEXT",
		Label:      "Workspace",
	})

	recentmetadataCollectionMetadata.SetField(&datasource.COLLECTION_FIELD)
	recentmetadataCollectionMetadata.SetField(&datasource.UPDATEDBY_FIELD_METADATA)
	recentmetadataCollectionMetadata.SetField(&datasource.UPDATEDAT_FIELD_METADATA)
	recentmetadataCollectionMetadata.SetField(&datasource.UNIQUE_KEY_FIELD_METADATA)

	err = connection.Load(newOp, inContextSession)
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

		err = item.SetField("uesio/core.collection", meta.METADATA_NAME_MAP[strings.ToUpper(collectionName)])
		if err != nil {
			return err
		}
		return nil
	})

}

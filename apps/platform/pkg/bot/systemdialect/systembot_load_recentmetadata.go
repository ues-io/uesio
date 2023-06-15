package systemdialect

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runRecentMetadataLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	//intercepts the collection uesio/studio.recentmetadata & enhances the LoadOp
	//Add the required metadata to compleat the operation

	//SMART WAY of GETTING THE WS (Open to other ways of doing this)
	//add the end I just need to get the workspace ID but preserv the orignial session
	// for the query

	workspace := op.Params["workspacename"]
	if workspace == "" {
		return errors.New("No Workspace Name Parameter Provided")
	}

	app := op.Params["app"]
	if app == "" {
		return errors.New("No App Parameter Provided")
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
		return errors.New("Error getting recent metadata, missing workspace id")
	}

	//END

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

	return connection.Load(newOp, inContextSession)

}

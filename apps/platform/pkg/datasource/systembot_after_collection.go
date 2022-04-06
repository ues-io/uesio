package datasource

import (
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runCollectionAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	var workspaceID string

	err := request.LoopChanges(func(change *adapt.ChangeItem) error {

		err := checkWorkspaceID(&workspaceID, change)
		if err != nil {
			return err
		}

		name, err := change.GetFieldAsString("uesio/studio.name")
		if err != nil {
			return err
		}

		if err = isRequired(name, "Collection", "Name"); err != nil {
			return err
		}

		label, err := change.GetFieldAsString("uesio/studio.label")
		if err != nil {
			return err
		}

		if err = isRequired(label, "Collection", "Label"); err != nil {
			return err
		}

		plabel, err := change.GetFieldAsString("uesio/studio.plurallabel")
		if err != nil {
			return err
		}

		if err = isRequired(plabel, "Collection", "Plural Label"); err != nil {
			return err
		}

		//Creates Default Name Field for collection
		if change.IsNew {

			//TO-DO Nice way of doing
			idParts := strings.Split(workspaceID, "_")
			fieldCollection := idParts[0] + "." + name
			fieldItem := adapt.Item{}
			workspace := map[string]interface{}{
				"uesio/core.id": workspaceID,
			}
			fieldItem.SetField("uesio/studio.name", "name")
			fieldItem.SetField("uesio/studio.type", "TEXT")
			fieldItem.SetField("uesio/studio.label", "Name")
			fieldItem.SetField("uesio/studio.collection", fieldCollection)
			fieldItem.SetField("uesio/studio.workspace", workspace)

			fieldChanges := adapt.Collection{}
			fieldChanges = append(fieldChanges, fieldItem)

			//Update Collection
			collectionId, err := change.GetField("uesio/core.id")
			if err != nil {
				return err
			}
			collectionItem := adapt.Item{}
			collectionChanges := adapt.Collection{}
			namefield := idParts[0] + ".name"

			collectionItem.SetField("uesio/studio.namefield", namefield)
			collectionItem.SetField("uesio/core.id", collectionId)

			collectionChanges = append(collectionChanges, collectionItem)

			requests := []SaveRequest{
				{
					Collection: "uesio/studio.field",
					Wire:       "defaultnamefield",
					Changes:    &fieldChanges,
				},
				{
					Collection: "uesio/studio.collection",
					Wire:       "defaultnamefieldcoll",
					Changes:    &collectionChanges,
				},
			}

			err = SaveWithOptions(requests, session, GetConnectionSaveOptions(connection))

			if err != nil {
				return err
			}

		}

		return nil
	})
	if err != nil {
		return err
	}

	return nil
}

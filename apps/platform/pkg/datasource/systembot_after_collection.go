package datasource

import (
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runCollectionAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	var workspaceID string

	fieldChanges := adapt.Collection{}
	collectionChanges := adapt.Collection{}

	err := request.LoopChanges(func(change *adapt.ChangeItem) error {

		err := checkWorkspaceID(&workspaceID, change)
		if err != nil {
			return err
		}

		name, err := change.GetFieldAsString("uesio/studio.name")
		if err != nil {
			return err
		}

		//Creates Default Name Field for collection
		if change.IsNew {

			//TO-DO Nice way of doing
			idParts := strings.Split(workspaceID, "_")
			fieldCollection := idParts[0] + "." + name
			fieldItem := adapt.Item{
				"uesio/studio.name":       "name",
				"uesio/studio.type":       "TEXT",
				"uesio/studio.label":      "Name",
				"uesio/studio.collection": fieldCollection,
				"uesio/studio.workspace": map[string]interface{}{
					"uesio/core.id": workspaceID,
				},
			}

			fieldChanges = append(fieldChanges, fieldItem)

			namefield := idParts[0] + ".name"
			collectionItem := adapt.Item{
				"uesio/studio.namefield": namefield,
				"uesio/core.id":          change.IDValue,
			}

			collectionChanges = append(collectionChanges, collectionItem)
		}

		return nil
	})
	if err != nil {
		return err
	}

	return SaveWithOptions([]SaveRequest{
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
	}, session, GetConnectionSaveOptions(connection))

}

package datasource

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func ParseKeyCollectionKey(key string) (string, string, string, string, error) {

	keyArray := strings.Split(key, "_")
	if len(keyArray) != 3 {
		return "", "", "", "", errors.New("Invalid Key: " + key)
	}

	keyArray2 := strings.Split(keyArray[0], "/")
	if len(keyArray2) != 2 {
		return "", "", "", "", errors.New("Invalid Key: " + key)
	}

	return keyArray2[0], keyArray2[1], keyArray[1], keyArray[2], nil
}

func deleteCollectionFields(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	ids := []string{}
	for i := range request.Deletes {
		collectionID := request.Deletes[i].IDValue
		ownerName, appName, _, collectionName, err := ParseKeyCollectionKey(collectionID)
		if err != nil {
			return err
		}
		ids = append(ids, ownerName+"/"+appName+"."+collectionName)
	}

	if len(ids) == 0 {
		return nil
	}

	fc := meta.FieldCollection{}
	err := PlatformLoad(&fc, &PlatformLoadOptions{
		Conditions: []adapt.LoadRequestCondition{
			{
				Field:    "uesio/studio.collection",
				Value:    ids,
				Operator: "IN",
			},
		},
		Connection: connection,
	}, session)
	if err != nil {
		return err
	}

	delIds := adapt.Collection{}
	fc.Loop(func(item loadable.Item, _ string) error {
		fieldId, err := item.GetField(adapt.ID_FIELD)
		if err != nil {
			return err
		}

		fieldIdAsString, ok := fieldId.(string)
		if !ok {
			return errors.New("Delete id must be a string")
		}

		delIds = append(delIds, &adapt.Item{
			adapt.ID_FIELD: fieldIdAsString,
		})

		return nil
	})

	return SaveWithOptions([]SaveRequest{
		{
			Collection: "uesio/studio.field",
			Wire:       "RunCollectionAfterSaveBot",
			Deletes:    &delIds,
		},
	}, session, GetConnectionSaveOptions(connection))

}

func runCollectionAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	return deleteCollectionFields(request, connection, session)

	// I'm actually not sure we want to do this at all.
	// Maybe this functionality could be part of a generator.
	// This will cause all deployments to auto-create name fields,
	// Which for some collections, this is not what we want.
	//return nil
	/*
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
	*/

}

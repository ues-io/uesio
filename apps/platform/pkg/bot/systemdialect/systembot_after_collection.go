package systemdialect

import (
	"errors"
	"reflect"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

var STUDIO_UNIQUE_KEY_FIELD = "uesio/studio.uniquekey"
var ACCEPTED_UNIQUE_KEY_TYPES = map[string]bool{
	"TEXT":       true,
	"NUMBER":     true,
	"SELECT":     true,
	"REFERENCE":  true,
	"USER":       true,
	"DATE":       true,
	"TIMESTAMP":  true,
	"EMAIL":      true,
	"AUTONUMBER": true,
}

func parseUniquekeyToCollectionKey(uniquekey string) (string, error) {
	//ben/greenlink:dev:companymember to ben/greenlink.companymember
	keyArray := strings.Split(uniquekey, ":")
	if len(keyArray) != 3 {
		return "", errors.New("Invalid Collection Key: " + uniquekey)
	}

	return keyArray[0] + "." + keyArray[2], nil
}

func deleteCollectionFields(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	ids := []string{}
	for i := range request.Deletes {
		collectionID := request.Deletes[i].IDValue
		ids = append(ids, collectionID)
	}

	if len(ids) == 0 {
		return nil
	}

	cc := meta.CollectionCollection{}
	err := datasource.PlatformLoad(&cc, &datasource.PlatformLoadOptions{
		Conditions: []adapt.LoadRequestCondition{
			{
				Field:    adapt.ID_FIELD,
				Value:    ids,
				Operator: "IN",
			},
		},
		Connection: connection,
	}, session)
	if err != nil {
		return err
	}

	fieldIds := []string{}
	cc.Loop(func(item meta.Item, _ string) error {
		uniquekey, err := item.GetField(adapt.UNIQUE_KEY_FIELD)
		if err != nil {
			return err
		}

		uniquekeyAsString, ok := uniquekey.(string)
		if !ok {
			return errors.New("Delete id must be a string")
		}

		fieldId, err := parseUniquekeyToCollectionKey(uniquekeyAsString)
		if err != nil {
			return err
		}
		fieldIds = append(fieldIds, fieldId)

		return nil
	})

	if len(fieldIds) == 0 {
		return nil
	}

	fc := meta.FieldCollection{}
	err = datasource.PlatformLoad(&fc, &datasource.PlatformLoadOptions{
		Conditions: []adapt.LoadRequestCondition{
			{
				Field:    "uesio/studio.collection",
				Value:    fieldIds,
				Operator: "IN",
			},
		},
		Connection: connection,
	}, session)
	if err != nil {
		return err
	}

	delIds := adapt.Collection{}
	fc.Loop(func(item meta.Item, _ string) error {
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

	if len(delIds) == 0 {
		return nil
	}

	return datasource.SaveWithOptions([]datasource.SaveRequest{
		{
			Collection: "uesio/studio.field",
			Wire:       "RunCollectionAfterSaveBot",
			Deletes:    &delIds,
		},
	}, session, datasource.GetConnectionSaveOptions(connection))
}

func validateUniqueKey(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	var workspaceID string
	metadataResponse := &adapt.MetadataCache{}
	collections := datasource.MetadataRequest{
		Options: &datasource.MetadataRequestOptions{
			LoadAllFields: true,
		},
	}

	//Pre-Loop for uniquekeys
	err := request.LoopChanges(func(change *adapt.ChangeItem) error {

		err := checkWorkspaceID(&workspaceID, change)
		if err != nil {
			return err
		}

		collectionID, err := parseUniquekeyToCollectionKey(change.UniqueKey)
		if err != nil {
			return err
		}

		err = collections.AddCollection(collectionID)
		if err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return err
	}

	wsSession := session.RemoveWorkspaceContext()
	if workspaceID != "" {
		err = datasource.AddWorkspaceContextByID(workspaceID, wsSession, connection)
		if err != nil {
			return err
		}

		err = collections.Load(metadataResponse, wsSession, connection)
		if err != nil {
			return err
		}
	}

	err = request.LoopChanges(func(change *adapt.ChangeItem) error {

		oldUniquekey, err := change.GetOldField(STUDIO_UNIQUE_KEY_FIELD)
		if err != nil {
			return err
		}
		newUniquekey, err := change.GetField(STUDIO_UNIQUE_KEY_FIELD)
		if err != nil {
			return err
		}
		uniquekeyHasChanged := !reflect.DeepEqual(oldUniquekey, newUniquekey)

		if uniquekeyHasChanged {
			collectionID, err := parseUniquekeyToCollectionKey(change.UniqueKey)
			if err != nil {
				return err
			}

			collectionMetadata, err := metadataResponse.GetCollection(collectionID)
			if err != nil {
				return err
			}

			uniquekeyFieldList := newUniquekey.([]interface{})
			for _, fieldId := range uniquekeyFieldList {
				stringVal, isString := fieldId.(string)
				if !isString {
					return errors.New("Invalid field ID")
				}
				subField, err := collectionMetadata.GetField(stringVal)
				if err != nil {
					return errors.New("UniqueKey part " + stringVal + " not found:" + err.Error())
				}

				if _, ok := ACCEPTED_UNIQUE_KEY_TYPES[subField.Type]; !ok || subField.GetFullName() == adapt.UNIQUE_KEY_FIELD {
					keys := make([]string, 0, len(ACCEPTED_UNIQUE_KEY_TYPES))
					for k := range ACCEPTED_UNIQUE_KEY_TYPES {
						keys = append(keys, k)
					}

					keysStr := strings.Join(keys[:], ", ")
					return errors.New("UniqueKey can only be made up of fields of type: " + keysStr)
				}
			}
		}

		return nil

	})

	return err

}

func runCollectionAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	err := deleteCollectionFields(request, connection, session)
	if err != nil {
		return err
	}

	return validateUniqueKey(request, connection, session)

}

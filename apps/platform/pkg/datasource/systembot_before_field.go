package datasource

import (
	"context"
	"errors"

	"github.com/PaesslerAG/gval"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getFieldsInExpression(expression string, metadata *adapt.CollectionMetadata) (meta.Item, map[string]bool) {
	fields := adapt.ChangeItem{FieldChanges: &adapt.Item{}, Metadata: metadata}
	fieldKeys := map[string]bool{}
	var UesioTestLanguage = gval.NewLanguage(
		adapt.UesioLanguage,
		gval.VariableSelector(func(path gval.Evaluables) gval.Evaluable {
			return func(c context.Context, v interface{}) (interface{}, error) {

				keys, err := path.EvalStrings(c, v)

				if err != nil {
					return nil, err
				}

				fullId := keys[0]

				if fullId != "" {

					field, err := fields.Metadata.GetField(fullId)
					if err != nil {
						return nil, err
					}

					switch field.Type {
					case "NUMBER":
						fields.FieldChanges.SetField(fullId, 1234)
					case "TEXT":
						fields.FieldChanges.SetField(fullId, "Dummy Data")
					case "LONGTEXT":
						fields.FieldChanges.SetField(fullId, "Dummy Data")
					case "CHECKBOX":
						fields.FieldChanges.SetField(fullId, true)
					default:
						fields.FieldChanges.SetField(fullId, "Dummy Data")
					}

					fieldKeys[fullId] = true
					return fullId, nil
				}

				return nil, nil

			}
		}),
	)

	UesioTestLanguage.Evaluate(expression, fields)

	return fields.FieldChanges, fieldKeys
}

func runFieldBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	depMap := MetadataDependencyMap{}
	var workspaceID string
	metadataResponse := &adapt.MetadataCache{}
	collections := MetadataRequest{
		Options: &MetadataRequestOptions{
			LoadAllFields: true,
		},
	}

	//Pre-Loop for formula fields
	err := request.LoopChanges(func(change *adapt.ChangeItem) error {

		err := checkWorkspaceID(&workspaceID, change)
		if err != nil {
			return err
		}

		ftype, err := change.GetFieldAsString("uesio/studio.type")
		if err != nil {
			return err
		}

		if ftype == "FORMULA" {
			collectionID, err := change.GetFieldAsString("uesio/studio.collection")
			if err != nil {
				return err
			}

			err = collections.AddCollection(collectionID)
			if err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return err
	}

	wsSession := session.RemoveWorkspaceContext()

	if workspaceID != "" {
		err = AddWorkspaceContextByID(workspaceID, wsSession, connection)
		if err != nil {
			return err
		}

		err = collections.Load(metadataResponse, wsSession)
		if err != nil {
			return err
		}
	}

	err = request.LoopChanges(func(change *adapt.ChangeItem) error {
		err := checkWorkspaceID(&workspaceID, change)
		if err != nil {
			return err
		}

		ftype, err := change.GetFieldAsString("uesio/studio.type")
		if err != nil {
			return err
		}

		_, ok := meta.GetFieldTypes()[ftype]
		if !ok {
			return errors.New("Invalid Field Type for Field: " + ftype)
		}

		err = depMap.AddRequired(change, "collection", "uesio/studio.collection")
		if err != nil {
			return err
		}

		err = depMap.AddOptional(change, "label", "uesio/studio.languagelabel")
		if err != nil {
			return err
		}

		_, err = change.GetField("uesio/studio.validate")
		if err == nil {
			validateType, _ := change.GetFieldAsString("uesio/studio.validate->uesio/studio.type")
			if validateType == "REGEX" {
				err = depMap.AddRequired(change, "field", "uesio/studio.validate->uesio/studio.regex")
				if err != nil {
					return err
				}
			}
		}

		switch ftype {
		case "FILE":
			err = depMap.AddRequired(change, "field", "uesio/studio.file->uesio/studio.filecollection")
			if err != nil {
				return err
			}
			_, err := requireValue(change, "uesio/studio.file->uesio/studio.accept")
			if err != nil {
				return err
			}
		case "SELECT", "MULTISELECT":
			err = depMap.AddRequired(change, "selectlist", "uesio/studio.selectlist")
			if err != nil {
				return err
			}
		case "REFERENCE":
			err = depMap.AddRequired(change, "collection", "uesio/studio.reference->uesio/studio.collection")
			if err != nil {
				return err
			}
		case "FORMULA":

			expression, err := requireValue(change, "uesio/studio.formula->uesio/studio.expression")
			if err != nil {
				return err
			}

			_, err = requireValue(change, "uesio/studio.formula->uesio/studio.returntype")
			if err != nil {
				return err
			}

			collectionID, err := change.GetFieldAsString("uesio/studio.collection")
			if err != nil {
				return err
			}

			collectionMetadata, err := metadataResponse.GetCollection(collectionID)
			if err != nil {
				return err
			}

			fields, fieldKeys := getFieldsInExpression(expression, collectionMetadata)
			_, err = adapt.UesioLanguage.Evaluate(expression, fields)
			if err != nil {
				return errors.New("Field: invalid expression:" + err.Error())
			}

			//make sure that the field in the expression are valid
			err = depMap.AddMap(fieldKeys, "field")
			if err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return err
	}

	items, err := depMap.GetItems()
	if err != nil {
		return err
	}

	return checkValidItems(workspaceID, items, session, connection)

}

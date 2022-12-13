package datasource

import (
	"context"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type TestEvaluator struct {
	metadata  *adapt.CollectionMetadata
	fieldKeys map[string]bool
}

func getDummyData(fieldType string, field *adapt.FieldMetadata) interface{} {
	switch fieldType {
	case "NUMBER":
		return 1234
	case "TEXT", "LONGTEXT":
		return "Dummy Data"
	case "CHECKBOX":
		return true
	case "FORMULA":
		return getDummyData(field.FormulaMetadata.ReturnType, nil)
	default:
		return "Dummy Data"
	}
}

func (te *TestEvaluator) SelectGVal(ctx context.Context, k string) (interface{}, error) {

	field, err := te.metadata.GetField(k)
	if err != nil {
		return nil, err
	}

	te.fieldKeys[k] = true

	return getDummyData(field.Type, field), nil

}

func runFieldBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	depMap := MetadataDependencyMap{}
	var workspaceID string
	var doLoad = false
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
			doLoad = true
		}

		return nil
	})
	if err != nil {
		return err
	}

	if doLoad {
		wsSession := session.RemoveWorkspaceContext()
		if workspaceID != "" {
			err = AddWorkspaceContextByID(workspaceID, wsSession, connection)
			if err != nil {
				return err
			}

			err = collections.Load(metadataResponse, connection, wsSession)
			if err != nil {
				return err
			}
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

			testEval := &TestEvaluator{
				metadata:  collectionMetadata,
				fieldKeys: map[string]bool{},
			}

			_, err = adapt.UesioLanguage.Evaluate(expression, testEval)
			if err != nil {
				return errors.New("Field: invalid expression:" + err.Error())
			}

			//make sure that the field in the expression are valid
			err = depMap.AddMap(testEval.fieldKeys, "field")
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

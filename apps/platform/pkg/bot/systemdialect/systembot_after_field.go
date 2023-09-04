package systemdialect

import (
	"context"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
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

func runFieldAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	depMap := MetadataDependencyMap{}

	metadataResponse := &adapt.MetadataCache{}
	collections := datasource.MetadataRequest{
		Options: &datasource.MetadataRequestOptions{
			LoadAllFields: true,
		},
	}

	workspaceID, err := GetWorkspaceIDFromParams(request.Params, connection, session)
	if err != nil {
		return err
	}

	//Pre-Loop for formula fields
	err = request.LoopChanges(func(change *adapt.ChangeItem) error {

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

	if request.HasChanges() {

		wsSession, err := datasource.AddWorkspaceContextByID(workspaceID, session, connection)
		if err != nil {
			return err
		}

		err = collections.Load(metadataResponse, wsSession, connection)
		if err != nil {
			return err
		}
	}

	err = request.LoopChanges(func(change *adapt.ChangeItem) error {

		ftype, err := change.GetFieldAsString("uesio/studio.type")
		if err != nil {
			return err
		}

		switch ftype {
		case "FORMULA":

			expression, err := requireValue(change, "uesio/studio.formula->uesio/studio.expression")
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

			for key := range testEval.fieldKeys {
				field, err := collectionMetadata.GetField(key)
				if err != nil {
					return err
				}

				if field.IsFormula {
					return errors.New("Field: invalid expression: Formula field cannot reference another formula field")
				}

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

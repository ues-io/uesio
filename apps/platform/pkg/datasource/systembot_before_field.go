package datasource

import (
	"context"
	"errors"

	"github.com/PaesslerAG/gval"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getFieldsInExpression(expression string) (loadable.Item, map[string]bool) {
	fields := adapt.ChangeItem{FieldChanges: &adapt.Item{}}
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
					fields.FieldChanges.SetField(fullId, "Dummy Data") //we need the collection metadata here
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
	collectionKeys := map[string]bool{}
	allKeys := map[string]map[string]bool{}
	var workspaceID string
	var items []meta.BundleableItem

	err := request.LoopChanges(func(change *adapt.ChangeItem) error {
		err := checkWorkspaceID(&workspaceID, change)
		if err != nil {
			return err
		}

		ftype, err := change.GetFieldAsString("uesio/studio.type")
		if err != nil {
			return err
		}

		if err = isRequired(ftype, "Field", "Type"); err != nil {
			return err
		}

		collection, err := change.GetFieldAsString("uesio/studio.collection")
		if err != nil {
			return err
		}

		if err = isRequired(ftype, "Field", "Collection"); err != nil {
			return err
		}

		switch ftype {
		case "REFERENCE":
			referencedCollection, err := change.GetFieldAsString("uesio/studio.reference->uesio/studio.collection")
			if err != nil {
				return err
			}
			if err = isRequired(referencedCollection, "Field", "Referenced Collection"); err != nil {
				return err
			}
			collectionKeys[referencedCollection] = true
		case "FORMULA":

			expression, err := change.GetFieldAsString("uesio/studio.formula->uesio/studio.expression")
			if err != nil {
				return err
			}
			if err = isRequired(expression, "Field", "Expression"); err != nil {
				return err
			}

			returntype, err := change.GetFieldAsString("uesio/studio.formula->uesio/studio.returntype")
			if err != nil {
				return err
			}
			if err = isRequired(returntype, "Field", "Return type"); err != nil {
				return err
			}

			fields, fieldKeys := getFieldsInExpression(expression)
			_, err = adapt.UesioLanguage.Evaluate(expression, fields)
			if err != nil {
				return errors.New("Field: invalid expression:" + err.Error())
			}

			//make sure that the field in the expression are valid

			fieldItems, err := meta.NewFields(fieldKeys, collection)
			if err != nil {
				return err
			}

			items = append(items, fieldItems...)

		}

		return nil
	})
	if err != nil {
		return err
	}

	allKeys["collection"] = collectionKeys
	allitems, err := getAllItems(allKeys)
	if err != nil {
		return err
	}

	items = append(items, allitems...)

	return checkValidItems(workspaceID, items, session, connection)

}

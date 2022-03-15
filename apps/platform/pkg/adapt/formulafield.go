package adapt

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/PaesslerAG/gval"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

var (
	UesioLanguage = gval.NewLanguage(
		gval.Full(),
		gval.VariableSelector(func(path gval.Evaluables) gval.Evaluable {
			return func(c context.Context, v interface{}) (interface{}, error) {
				keys, err := path.EvalStrings(c, v)
				if err != nil {
					return nil, err
				}
				fullId := strings.Join(keys, ".")
				item, ok := v.(*Item)
				if !ok {
					return nil, errors.New("Casting error in formula field: " + fullId)
				}
				id, err := item.GetField(fullId)

				if err != nil {
					return "{Invalid Field}", nil
				}

				if id == nil {
					return "{Missing Field}", nil
				}

				return id, nil

			}
		}),
		gval.Function("STR_LEN", func(args ...interface{}) (interface{}, error) {
			length := len(args[0].(string))
			return (float64)(length), nil
		}),
		gval.Function("TO_STRING", func(args ...interface{}) (interface{}, error) {
			valStr := fmt.Sprint(args[0])
			return valStr, nil
		}),
	)
)

func HandleFormulaFields(
	formulaFields map[string]*FieldMetadata,
	collectionMetadata *CollectionMetadata,
	item loadable.Item,
) error {

	for _, formulaField := range formulaFields {
		formulaOptions := formulaField.FormulaOptions
		if formulaOptions == nil {
			return nil
		}
		formula := formulaOptions.Formula
		if formula == "" {
			return nil
		}
		value, err := UesioLanguage.Evaluate(formula, item)
		if err != nil {
			return err
		}
		item.SetField(formulaField.GetFullName(), value)
	}

	return nil
}

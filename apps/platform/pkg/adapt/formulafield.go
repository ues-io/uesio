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
				item, ok := v.(loadable.Gettable)
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
		gval.Function("FIRST", func(args ...interface{}) (interface{}, error) {
			valStr := fmt.Sprint(args[0])
			if valStr == "" {
				return "", nil
			}
			return valStr[0:1], nil
		}),
	)
)

type evalFunc func(item loadable.Item) error

func populateFormulaField(field *FieldMetadata, exec gval.Evaluable) evalFunc {
	return func(item loadable.Item) error {

		value, err := exec(context.Background(), item)
		if err != nil {
			return err
		}

		err = item.SetField(field.GetFullName(), value)
		if err != nil {
			return err
		}

		return nil

	}
}

func GetFormulaFunction(fields map[string]*FieldMetadata) evalFunc {

	populations := []evalFunc{}
	for _, field := range fields {
		if field.IsFormula {
			formulaMetadata := field.FormulaMetadata
			if formulaMetadata == nil {
				continue
			}
			expression := formulaMetadata.Expression
			if expression == "" {
				continue
			}

			exec, err := UesioLanguage.NewEvaluable(expression)
			if err != nil {
				continue
			}
			populations = append(populations, populateFormulaField(field, exec))
		}
	}

	return func(item loadable.Item) error {
		for _, population := range populations {
			err := population(item)
			if err != nil {
				return err
			}
		}
		return nil
	}
}

package adapt

import (
	"context"
	"fmt"
	"unicode"

	"github.com/PaesslerAG/gval"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

var UesioLanguage = gval.NewLanguage(
	gval.Full(),
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
	gval.Init(func(ctx context.Context, parser *gval.Parser) (gval.Evaluable, error) {
		parser.SetIsIdentRuneFunc(func(r rune, pos int) bool {
			return unicode.IsLetter(r) || r == '_' ||
				(pos > 0 && (unicode.IsDigit(r) || r == '.' || r == '/'))
		})
		return parser.ParseExpression(ctx)
	}),
)

type evalFunc func(item meta.Item) error

type RuntimeEvaluator struct {
	item               meta.Item
	collectionMetadata *CollectionMetadata
}

func (re *RuntimeEvaluator) SelectGVal(ctx context.Context, k string) (interface{}, error) {

	fieldMetadata, err := re.collectionMetadata.GetField(k)
	if err != nil {
		return nil, err
	}
	value, err := re.item.GetField(k)
	if err != nil {
		return nil, err
	}
	if fieldMetadata.Type == "NUMBER" {
		if value == nil {
			return 0, nil
		}
	}
	return value, nil
}

func populateFormulaField(field *FieldMetadata, collectionMetadata *CollectionMetadata, exec gval.Evaluable) evalFunc {
	return func(item meta.Item) error {

		evaluator := &RuntimeEvaluator{item: item, collectionMetadata: collectionMetadata}

		value, err := exec(context.Background(), evaluator)
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

func GetFormulaFunction(fields map[string]*FieldMetadata, collectionMetadata *CollectionMetadata) evalFunc {

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
			populations = append(populations, populateFormulaField(field, collectionMetadata, exec))
		}
	}

	return func(item meta.Item) error {
		for _, population := range populations {
			err := population(item)
			if err != nil {
				return err
			}
		}
		return nil
	}
}

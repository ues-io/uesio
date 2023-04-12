package adapt

import (
	"context"
	"fmt"
	"github.com/thecloudmasters/uesio/pkg/goutils"
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
	item meta.Item
}

func (re *RuntimeEvaluator) SelectGVal(ctx context.Context, k string) (interface{}, error) {
	return re.item.GetField(k)
}

type CompileTimeEvaluator struct {
	collectionMetadata *CollectionMetadata
	referencedFieldIds map[string]bool
}

func NewCompileTimeEvaluator(collectionMetadata *CollectionMetadata) *CompileTimeEvaluator {
	return &CompileTimeEvaluator{
		collectionMetadata,
		map[string]bool{},
	}
}

func (re *CompileTimeEvaluator) SelectGVal(ctx context.Context, fieldId string) (interface{}, error) {
	re.referencedFieldIds[fieldId] = true
	// Return a dummy value of the correct type for the metadata type
	//fieldMetadata, err := re.collectionMetadata.GetField(fieldId)
	//if err != nil {
	//	return nil, errors.New("Unknown field referenced in formula: " + fieldId)
	//}
	//return getDummyValueForFieldType(fieldMetadata.Type), nil
	return "", nil
}

func getDummyValueForFieldType(metadataType string) interface{} {
	switch metadataType {
	case "NUMBER":
		return 1
	case "CHECKBOX":
		return true
	}
	//TODO add others as needed
	return "a"
}

func ExtractDependentFieldsFromExpression(expression string, collectionMetadata *CollectionMetadata) ([]string, error) {

	// Parse the expression using an evaluator which merely grabs all referenced fields and adds them to a map
	evaluator := NewCompileTimeEvaluator(collectionMetadata)

	exec, err := UesioLanguage.NewEvaluable(expression)
	if err != nil {
		return nil, err
	}

	exec(context.Background(), evaluator)

	return goutils.MapKeys(evaluator.referencedFieldIds), nil

}

func populateFormulaField(field *FieldMetadata, exec gval.Evaluable) evalFunc {
	return func(item meta.Item) error {

		evaluator := &RuntimeEvaluator{item: item}

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

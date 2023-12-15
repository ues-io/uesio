package formula

import (
	"context"
	"fmt"
	"regexp"
	"text/scanner"
	"unicode"

	"github.com/PaesslerAG/gval"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

var identFunc = func(r rune, pos int) bool {
	return unicode.IsLetter(r) || r == '_' ||
		(pos > 0 && (unicode.IsDigit(r) || r == '.' || r == '/'))
}

var baseLanguage = gval.NewLanguage(
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
)

var validMetaRegex, _ = regexp.Compile(`^\w+\/\w+\.\w+$`)

var TestLanguage = gval.NewLanguage(
	baseLanguage,
	gval.Init(func(ctx context.Context, parser *gval.Parser) (gval.Evaluable, error) {
		parser.SetIsIdentRuneFunc(identFunc)
		tokens := map[string]bool{}

		for {
			switch parser.Scan() {
			case scanner.EOF:
				return parser.Const(tokens), nil
			default:
				token := parser.TokenText()
				if validMetaRegex.MatchString(token) {
					tokens[token] = true
				}
			}
		}
	}),
)

var UesioLanguage = gval.NewLanguage(
	baseLanguage,
	gval.Init(func(ctx context.Context, parser *gval.Parser) (gval.Evaluable, error) {
		parser.SetIsIdentRuneFunc(identFunc)
		return parser.ParseExpression(ctx)
	}),
)

type evalFunc func(item meta.Item) error

type RuntimeEvaluator struct {
	item               meta.Item
	collectionMetadata *wire.CollectionMetadata
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

func populateFormulaField(ctx context.Context, field *wire.FieldMetadata, collectionMetadata *wire.CollectionMetadata, exec gval.Evaluable) evalFunc {
	return func(item meta.Item) error {

		evaluator := &RuntimeEvaluator{item: item, collectionMetadata: collectionMetadata}

		value, err := exec(ctx, evaluator)
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

func GetFormulaFunction(ctx context.Context, fields map[string]*wire.FieldMetadata, collectionMetadata *wire.CollectionMetadata) evalFunc {

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
			populations = append(populations, populateFormulaField(ctx, field, collectionMetadata, exec))
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

func GetFormulaFields(ctx context.Context, expression string) (map[string]bool, error) {
	exec, err := TestLanguage.NewEvaluable(expression)
	if err != nil {
		return nil, err
	}

	value, err := exec(ctx, nil)
	if err != nil {
		return nil, err
	}

	fieldMap, _ := value.(map[string]bool)

	return fieldMap, nil
}

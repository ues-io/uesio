package adapt

import (
	"context"
	"errors"
	"fmt"
	"unicode"

	"github.com/PaesslerAG/gval"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

var UesioLanguage = gval.NewLanguage(
	gval.Full(),
	gval.VariableSelector(func(path gval.Evaluables) gval.Evaluable {
		return func(c context.Context, v interface{}) (interface{}, error) {
			keys, err := path.EvalStrings(c, v)
			if err != nil {
				return nil, err
			}
			fullId := keys[0]
			item, ok := v.(loadable.Gettable)
			if !ok {
				return nil, errors.New("Casting error in formula field: " + fullId)
			}
			id, err := item.GetField(fullId)
			if err != nil {
				return "", nil
			}

			if id == nil {
				return "", nil
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
	gval.Function("BYTE_HR", func(args ...interface{}) (interface{}, error) {
		b, ok := args[0].(float64)
		if ok {
			return ByteCountSI(b), nil
		}
		return "error", nil
	}),
	gval.Init(func(ctx context.Context, parser *gval.Parser) (gval.Evaluable, error) {
		parser.SetIsIdentRuneFunc(func(r rune, pos int) bool {
			return unicode.IsLetter(r) || r == '_' ||
				(pos > 0 && (unicode.IsDigit(r) || r == '.' || r == '/'))
		})
		return parser.ParseExpression(ctx)
	}),
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

func ByteCountSI(b float64) string {
	const unit = 1000
	if b < unit {
		return fmt.Sprintf("%.2f B", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB",
		float64(b)/float64(div), "kMGTPE"[exp])
}

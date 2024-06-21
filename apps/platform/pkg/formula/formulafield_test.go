package formula

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func TestIdentifierValidation(t *testing.T) {

	tests := []struct {
		name       string
		expression string
		fields     map[string]bool
	}{
		{
			"sanity",
			"2",
			map[string]bool{},
		},
		{
			"number after",
			"me/myapp.myfield*2",
			map[string]bool{
				"me/myapp.myfield": true,
			},
		},
		{
			"number before",
			"2*me/myapp.myfield",
			map[string]bool{
				"me/myapp.myfield": true,
			},
		},
		{
			"number before",
			"2*me/myapp.myfield*me/myapp.myotherfield",
			map[string]bool{
				"me/myapp.myfield":      true,
				"me/myapp.myotherfield": true,
			},
		},
		{
			"function",
			"2*TO_STRING(me/myapp.myfield)*me/myapp.myotherfield",
			map[string]bool{
				"me/myapp.myfield":      true,
				"me/myapp.myotherfield": true,
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fields, err := GetFormulaFields(context.Background(), tt.expression)
			if err != nil {
				t.Errorf("Error Getting Fields for Expression: %s", err.Error())
			}

			assert.Equal(t, tt.fields, fields)
		})
	}
}

func TestFormulas(t *testing.T) {

	tests := []struct {
		name           string
		expression     string
		item           meta.Item
		metadata       *wire.CollectionMetadata
		expectedResult interface{}
	}{
		{
			"sanity",
			"2",
			nil,
			nil,
			float64(2),
		},
		{
			"is blank no arg",
			"IS_BLANK()",
			nil,
			nil,
			true,
		},
		{
			"is blank empty string",
			"IS_BLANK(\"\")",
			nil,
			nil,
			true,
		},
		{
			"is blank with value",
			"IS_BLANK(\"hi\")",
			nil,
			nil,
			false,
		},
		{
			"is blank with missing merge value",
			"IS_BLANK(uesio/myapp.myfield)",
			&wire.Item{
				"uesio/myapp.myfield": nil,
			},
			&wire.CollectionMetadata{
				Fields: map[string]*wire.FieldMetadata{
					"uesio/myapp.myfield": {},
				},
			},
			true,
		},
		{
			"is blank with existing merge value",
			"IS_BLANK(uesio/myapp.myfield)",
			&wire.Item{
				"uesio/myapp.myfield": "hello",
			},
			&wire.CollectionMetadata{
				Fields: map[string]*wire.FieldMetadata{
					"uesio/myapp.myfield": {},
				},
			},
			false,
		},
		{
			"to string with number",
			"TO_STRING(45)",
			nil,
			nil,
			"45",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			exec, err := UesioLanguage.NewEvaluable(tt.expression)
			if err != nil {
				t.Errorf("Error Creating Expression: %s", err.Error())
			}

			evaluator := &RuntimeEvaluator{item: tt.item, collectionMetadata: tt.metadata}

			value, err := exec(context.Background(), evaluator)
			if err != nil {
				t.Errorf("Error Evaluating Expression: %s", err.Error())
			}

			assert.Equal(t, tt.expectedResult, value)
		})
	}
}

package adapt

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
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

			exec, err := TestLanguage.NewEvaluable(tt.expression)
			if err != nil {
				t.Errorf("Error: %s", err.Error())
			}

			value, err := exec(context.Background(), nil)
			if err != nil {
				t.Errorf("Error: %s", err.Error())
			}

			assert.Equal(t, tt.fields, value)

		})
	}
}

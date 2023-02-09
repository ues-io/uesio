package meta

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

var basicViewDef = `
# a cool comment
components: []
# another cool comment
wires: {}
`

func TestViewGetField(t *testing.T) {

	type testCase struct {
		name        string
		description string
		view        *View
		expectvalue interface{}
	}

	basicViewDefYaml := &yaml.Node{}
	yaml.Unmarshal([]byte(basicViewDef), basicViewDefYaml)

	var tests = []testCase{
		{
			"uesio/studio.name",
			"get the name field",
			&View{
				BundleableBase: BundleableBase{
					Name: "myviewname",
				},
			},
			"myviewname",
		},
		{
			"uesio/studio.definition",
			"get the definition field",
			&View{
				Definition: *basicViewDefYaml.Content[0],
			},
			strings.TrimPrefix(basicViewDef, "\n"),
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			result, err := tc.view.GetField(tc.name)
			if err != nil {
				t.Errorf("Unexpected failure getting field: %s", err.Error())
			}
			assert.Equal(t, result, tc.expectvalue)
		})
	}
}

func TestViewSetField(t *testing.T) {

	type testCase struct {
		name        string
		description string
		value       interface{}
		expectview  *View
	}

	basicViewDefYaml := &yaml.Node{}
	yaml.Unmarshal([]byte(basicViewDef), basicViewDefYaml)

	var tests = []testCase{
		{
			"uesio/studio.name",
			"set the name field",
			"myviewname",
			&View{
				BundleableBase: BundleableBase{
					Name: "myviewname",
				},
			},
		},
		{
			"uesio/studio.definition",
			"set the definition field",
			basicViewDef,
			&View{
				Definition: *basicViewDefYaml.Content[0],
			},
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {

			newView := &View{}

			err := newView.SetField(tc.name, tc.value)
			if err != nil {
				t.Errorf("Unexpected failure setting field: %s", err.Error())
			}
			assert.Equal(t, newView, tc.expectview)
		})
	}
}

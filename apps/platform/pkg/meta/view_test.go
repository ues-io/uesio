package meta

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

var basicViewDef = strings.TrimPrefix(`
# a cool comment
components: []
# another cool comment
wires: {}
`, "\n")

func getYamlNode(yamlContent string) yaml.Node {
	yamlNode := &yaml.Node{}
	yaml.Unmarshal([]byte(yamlContent), yamlNode)
	return *yamlNode.Content[0]
}

func TestViewGetField(t *testing.T) {

	type testCase struct {
		name        string
		description string
		view        *View
		expectvalue interface{}
	}

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
				Definition: getYamlNode(basicViewDef),
			},
			basicViewDef,
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
				Definition: getYamlNode(basicViewDef),
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

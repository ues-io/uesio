package meta

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

var basicComponentDef = strings.TrimPrefix(`
name: mycomponent
category: DATA
title: My Component
type: DECLARATIVE
`, "\n")

var basicComponentDefJSON = `{"namespace":"my/namespace","name":"mycomponent","title":"My Component","description":"","type":"DECLARATIVE","category":"DATA","discoverable":false}`

var badPropertiesValue = strings.TrimPrefix(`
name: mycomponent
category: DATA
title: My Component
type: DECLARATIVE
properties: Bad Data
`, "\n")

var badPropertiesValueJSON = `{"namespace":"my/namespace","name":"mycomponent","title":"My Component","description":"","type":"DECLARATIVE","category":"DATA","discoverable":false}`

var validPropertiesValue = strings.TrimPrefix(`
name: mycomponent
category: DATA
title: My Component
type: DECLARATIVE
properties:
  - type: TEXT
    name: text
    label: Text
`, "\n")

var validPropertiesValueJSON = `{"namespace":"my/namespace","name":"mycomponent","title":"My Component","description":"","type":"DECLARATIVE","category":"DATA","discoverable":false,"properties":[{"type":"TEXT","name":"text","label":"Text"}]}`

func TestComponentMarshalToJSON(t *testing.T) {

	type testCase struct {
		name        string
		description string
		path        string
		namespace   string
		yamlString  string
		expectJson  string
	}

	var tests = []testCase{
		{
			"simple",
			"simple",
			"mycomponent.yaml",
			"my/namespace",
			basicComponentDef,
			basicComponentDefJSON,
		},
		{
			"bad properties value",
			"bad properties value",
			"mycomponent.yaml",
			"my/namespace",
			badPropertiesValue,
			badPropertiesValueJSON,
		},
		{
			"valid properties value",
			"valid properties value",
			"mycomponent.yaml",
			"my/namespace",
			validPropertiesValue,
			validPropertiesValueJSON,
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {

			initial := (&ComponentCollection{}).GetItemFromPath(tc.path, tc.namespace)

			err := yaml.Unmarshal([]byte(tc.yamlString), initial)
			if err != nil {
				t.Errorf("Unexpected failure unmarshalling component: %s", err.Error())
			}

			bytes, err := initial.(*Component).GetBytes()
			if err != nil {
				t.Errorf("Unexpected failure marshalling component: %s", err.Error())
			}

			assert.JSONEq(t, string(bytes), tc.expectJson)
		})
	}
}

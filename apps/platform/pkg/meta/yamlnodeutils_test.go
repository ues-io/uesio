package meta

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

var simpleYaml = strings.TrimPrefix(`
name: myroute
path: mypath
view: myview
theme: mytheme
`, "\n")

var simpleYamlViewRemoved = strings.TrimPrefix(`
name: myroute
path: mypath
theme: mytheme
`, "\n")

func TestPickNodeFromMap(t *testing.T) {

	type testCase struct {
		name         string
		description  string
		initialYaml  string
		key          string
		returnValue  string
		expectedYaml string
	}

	var tests = []testCase{
		{
			"basic",
			"it should get the node and return the right value",
			simpleYaml,
			"view",
			"myview",
			simpleYamlViewRemoved,
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			node := getYamlNode(tc.initialYaml)
			result := pickNodeFromMap((*yaml.Node)(node), tc.key)
			mutatedNode, err := yaml.Marshal(node)
			if err != nil {
				t.Errorf("Unexpected failure marshalling: %s", err.Error())
			}
			resultNode, err := yaml.Marshal(result)
			if err != nil {
				t.Errorf("Unexpected failure marshalling: %s", err.Error())
			}
			assert.Equal(t, tc.returnValue, strings.TrimSuffix(string(resultNode), "\n"))
			assert.Equal(t, tc.expectedYaml, string(mutatedNode))
		})
	}

}

func TestPickStringProperty(t *testing.T) {

	type testCase struct {
		name         string
		description  string
		initialYaml  string
		key          string
		defaultValue string
		returnValue  string
	}

	var tests = []testCase{
		{
			"basic",
			"get the view property",
			simpleYaml,
			"view",
			"",
			"myview",
		},
		{
			"basic with default",
			"basic with default",
			simpleYamlViewRemoved,
			"view",
			"defaultView",
			"defaultView",
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			node := getYamlNode(tc.initialYaml)
			assert.Equal(t, tc.returnValue, pickStringProperty((*yaml.Node)(node), tc.key, tc.defaultValue))
		})
	}

}

func TestPickMetadataItem(t *testing.T) {

	type testCase struct {
		name         string
		description  string
		initialYaml  string
		key          string
		namespace    string
		defaultValue string
		returnValue  string
	}

	var tests = []testCase{
		{
			"basic",
			"get the view property",
			simpleYaml,
			"view",
			"my/namespace",
			"",
			"my/namespace.myview",
		},
		{
			"basic with default",
			"basic with default",
			simpleYamlViewRemoved,
			"view",
			"my/namespace",
			"my/namespace.defaultView",
			"my/namespace.defaultView",
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			node := getYamlNode(tc.initialYaml)
			assert.Equal(t, tc.returnValue, pickMetadataItem((*yaml.Node)(node), tc.key, tc.namespace, tc.defaultValue))
		})
	}

}

func TestRemoveDefault(t *testing.T) {

	type testCase struct {
		name         string
		description  string
		input        string
		defaultValue string
		expected     string
	}

	var tests = []testCase{
		{
			"not default",
			"not default",
			"my/namespace.other",
			"my/namespace.default",
			"my/namespace.other",
		},
		{
			"remove default",
			"remove default",
			"my/namespace.default",
			"my/namespace.default",
			"",
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			assert.Equal(t, tc.expected, removeDefault(tc.input, tc.defaultValue))
		})
	}

}

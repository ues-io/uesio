package meta

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

var localMetadataNames = TrimYamlString(`
name: somecollection
type: EXTERNAL
uniqueKey:
    - field1
    - field2
nameField: somefield
integration: someintegration
loadBot: someloadbot
saveBot: somesavebot
`)

var qualifiedMetadataReferences = TrimYamlString(`
name: somecollection
type: EXTERNAL
uniqueKey:
    - luigi/foo.field1
    - luigi/foo.field2
nameField: luigi/foo.somefield
integration: luigi/foo.someintegration
loadBot: luigi/foo.someloadbot
saveBot: luigi/foo.somesavebot
`)

var thisAppMetadataReferences = TrimYamlString(`
name: somecollection
type: EXTERNAL
uniqueKey:
    - this/app.field1
    - this/app.field2
nameField: this/app.somefield
integration: this/app.someintegration
loadBot: this/app.someloadbot
saveBot: this/app.somesavebot
`)

func TestCollectionUnmarshal(t *testing.T) {

	type testCase struct {
		name        string
		description string
		yamlString  string
		path        string
		namespace   string
		expected    *Collection
		expectedErr error
	}

	var tests = []testCase{
		{
			"fully-qualify local references",
			"Make sure all local metadata references are fully-qualified with the collection's namespace",
			localMetadataNames,
			"somecollection.yaml",
			"my/namespace",
			&Collection{
				BundleableBase: BundleableBase{
					Name:      "somecollection",
					Namespace: "my/namespace",
				},
				UniqueKeyFields: []string{
					"my/namespace.field1",
					"my/namespace.field2",
				},
				IdField:        "uesio/core.id",
				NameField:      "my/namespace.somefield",
				Type:           "EXTERNAL",
				IntegrationRef: "my/namespace.someintegration",
				LoadBot:        "my/namespace.someloadbot",
				SaveBot:        "my/namespace.somesavebot",
			},
			nil,
		},
		{
			"unlocalize this/app, replace with collection's namespace",
			"Make sure references with this/app are replaced with the collection's namespace",
			thisAppMetadataReferences,
			"somecollection.yaml",
			"my/namespace",
			&Collection{
				BundleableBase: BundleableBase{
					Name:      "somecollection",
					Namespace: "my/namespace",
				},
				UniqueKeyFields: []string{
					"my/namespace.field1",
					"my/namespace.field2",
				},
				IdField:        "uesio/core.id",
				NameField:      "my/namespace.somefield",
				Type:           "EXTERNAL",
				IntegrationRef: "my/namespace.someintegration",
				LoadBot:        "my/namespace.someloadbot",
				SaveBot:        "my/namespace.somesavebot",
			},
			nil,
		},
		{
			"leave fully qualified namespaces alone",
			"Make sure references with an actual namespace are unchanged",
			qualifiedMetadataReferences,
			"somecollection.yaml",
			"my/namespace",
			&Collection{
				BundleableBase: BundleableBase{
					Name:      "somecollection",
					Namespace: "my/namespace",
				},
				UniqueKeyFields: []string{
					"luigi/foo.field1",
					"luigi/foo.field2",
				},
				IdField:        "uesio/core.id",
				NameField:      "luigi/foo.somefield",
				Type:           "EXTERNAL",
				IntegrationRef: "luigi/foo.someintegration",
				LoadBot:        "luigi/foo.someloadbot",
				SaveBot:        "luigi/foo.somesavebot",
			},
			nil,
		},
		{
			"collection name/file path mismatch",
			"Fail if our name doesn't match our file path",
			localMetadataNames,
			"somecollection_badname.yaml",
			"my/namespace",
			nil,
			exceptions.NewBadRequestException("Metadata name does not match filename: somecollection, somecollection_badname"),
		},
	}

	for _, tc := range tests {
		t.Run(tc.description, func(t *testing.T) {
			initial := (&CollectionCollection{}).GetItemFromPath(tc.path, tc.namespace)
			err := yaml.Unmarshal([]byte(tc.yamlString), initial)
			if tc.expectedErr != nil {
				assert.Equal(t, tc.expectedErr, err)
				return
			}
			if err != nil {
				assert.Nil(t, err, "Unexpected failure unmarshalling: %s", err.Error())
			} else {
				assert.EqualValues(t, tc.expected, initial)
			}
		})
	}
}

func TestCollectionMarshal(t *testing.T) {

	type testCase struct {
		name              string
		description       string
		initial           *Collection
		expectedString    string
		expectedPath      string
		expectedNamespace string
	}

	var tests = []testCase{
		{
			"local metadata references",
			"all collections should be fully localized",
			&Collection{
				BundleableBase: BundleableBase{
					Name:      "somecollection",
					Namespace: "my/namespace",
				},
				UniqueKeyFields: []string{
					"field1",
					"field2",
				},
				NameField:      "somefield",
				Type:           "EXTERNAL",
				IntegrationRef: "someintegration",
				LoadBot:        "someloadbot",
				SaveBot:        "somesavebot",
			},
			localMetadataNames,
			"somecollection.yaml",
			"my/namespace",
		},
		{
			"fully-qualified metadata references",
			"fully-qualified references to other namespaces should be retained",
			&Collection{
				BundleableBase: BundleableBase{
					Name:      "somecollection",
					Namespace: "my/namespace",
				},
				UniqueKeyFields: []string{
					"luigi/foo.field1",
					"luigi/foo.field2",
				},
				NameField:      "luigi/foo.somefield",
				Type:           "EXTERNAL",
				IntegrationRef: "luigi/foo.someintegration",
				LoadBot:        "luigi/foo.someloadbot",
				SaveBot:        "luigi/foo.somesavebot",
			},
			qualifiedMetadataReferences,
			"somecollection.yaml",
			"my/namespace",
		},
	}

	for _, tc := range tests {
		t.Run(tc.description, func(t *testing.T) {

			result, err := yaml.Marshal(tc.initial)
			if err != nil {
				t.Errorf("Unexpected failure marshalling: %s", err.Error())
			}
			assert.Equal(t, tc.expectedString, string(result))
			assert.Equal(t, tc.expectedPath, tc.initial.GetPath())
			assert.Equal(t, tc.expectedNamespace, tc.initial.GetNamespace())
		})
	}

}

func TestCollectionRoundTrip(t *testing.T) {
	type testCase struct {
		name       string
		path       string
		namespace  string
		yamlString string
	}

	var tests = []testCase{
		{
			"round-trip with local references",
			"somecollection.yaml",
			"my/namespace",
			localMetadataNames,
		},
		{
			"round-trip with fully-qualified names",
			"somecollection.yaml",
			"my/namespace",
			qualifiedMetadataReferences,
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.name, func(t *testing.T) {
			initial := (&CollectionCollection{}).GetItemFromPath(tc.path, tc.namespace)
			err := yaml.Unmarshal([]byte(tc.yamlString), initial)
			if err != nil {
				t.Errorf("Unexpected failure unmarshalling: %s", err.Error())
			}

			result, err := yaml.Marshal(initial)
			if err != nil {
				t.Errorf("Unexpected failure marshalling: %s", err.Error())
			}
			assert.Equal(t, tc.yamlString, string(result))
		})
	}
}

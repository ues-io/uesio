package meta

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

var localSingleCollection = TrimYamlString(`
collection: account
`)
var localMultiCollection = TrimYamlString(`
multiCollection: true
collections:
    - account
    - contact
`)
var localMultiCollectionAny = TrimYamlString(`
multiCollection: true
`)

func TestReferenceMetadataUnmarshal(t *testing.T) {

	type testCase struct {
		name        string
		yamlString  string
		namespace   string
		expected    *ReferenceMetadata
		expectedErr error
	}

	var tests = []testCase{
		{
			"qualify single collection",
			localSingleCollection,
			"my/namespace",
			&ReferenceMetadata{
				Collection:      "my/namespace.account",
				MultiCollection: false,
				Namespace:       "my/namespace",
			},
			nil,
		},
		{
			"qualify multi collection with specific values",
			localMultiCollection,
			"my/namespace",
			&ReferenceMetadata{
				MultiCollection: true,
				CollectionsRefs: []string{
					"my/namespace.account",
					"my/namespace.contact",
				},
				Namespace: "my/namespace",
			},
			nil,
		},
		{
			"qualify multi collection, any target",
			localMultiCollectionAny,
			"my/namespace",
			&ReferenceMetadata{
				MultiCollection: true,
				Namespace:       "my/namespace",
			},
			nil,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			initial := &ReferenceMetadata{
				Namespace: tc.namespace,
			}
			err := yaml.Unmarshal([]byte(tc.yamlString), initial)
			if tc.expectedErr != nil {
				assert.Equal(t, tc.expectedErr, err)
				return
			}
			if err != nil {
				t.Errorf("Unexpected failure unmarshalling: %s", err.Error())
			}
			assert.Equal(t, initial, tc.expected)
		})
	}
}

func TestReferenceMetadataMarshal(t *testing.T) {

	type testCase struct {
		name           string
		initial        *ReferenceMetadata
		expectedString string
	}

	var tests = []testCase{
		{
			"marshal local single collection",
			&ReferenceMetadata{
				Collection:      "account",
				MultiCollection: false,
				Namespace:       "luigi/foo",
			},
			localSingleCollection,
		},
		{
			"marshal qualified single collection",
			&ReferenceMetadata{
				Collection:      "luigi/foo.account",
				MultiCollection: false,
				Namespace:       "luigi/foo",
			},
			localSingleCollection,
		},
		{
			"marshal qualified multi collection",
			&ReferenceMetadata{
				MultiCollection: true,
				CollectionsRefs: []string{
					"luigi/foo.account",
					"luigi/foo.contact",
				},
				Namespace: "luigi/foo",
			},
			localMultiCollection,
		},
		{
			"marshal multi-collection with any target",
			&ReferenceMetadata{
				MultiCollection: true,
				Namespace:       "luigi/foo",
			},
			localMultiCollectionAny,
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.name, func(t *testing.T) {
			result, err := yaml.Marshal(tc.initial)
			if err != nil {
				t.Errorf("Unexpected failure marshalling: %s", err.Error())
			}
			assert.Equal(t, tc.expectedString, string(result))
		})
	}

}

func TestReferenceMetadataRoundTrip(t *testing.T) {
	type testCase struct {
		name       string
		yamlString string
	}

	var tests = []testCase{
		{
			"local single collection",
			localSingleCollection,
		},
		{
			"local multi collection",
			localMultiCollection,
		},
		{
			"local multi collection any target",
			localMultiCollectionAny,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			initial := &ReferenceMetadata{}
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

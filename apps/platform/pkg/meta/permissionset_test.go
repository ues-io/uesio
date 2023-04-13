package meta

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

var sanity = `
name: mypermset
`

var withCollectionScalarTrue = `
name: mypermset
collections:
  uesio/core.user: true
`

var withCollectionScalarFalse = `
name: mypermset
collections:
  uesio/core.user: false
`

var withCollectionBlank = `
name: mypermset
collections:
  uesio/core.user:
`

var withCollectionNull = `
name: mypermset
collections:
  uesio/core.user: null
`

func TestPermissionSetYaml(t *testing.T) {

	type testCase struct {
		yamlText    []byte
		name        string
		description string
		expect      *PermissionSet
	}

	var tests = []testCase{
		{
			[]byte(sanity),
			"mypermset",
			"sanity",
			&PermissionSet{
				BundleableBase: BundleableBase{
					Name: "mypermset",
				},
			},
		},
		{
			[]byte(withCollectionScalarTrue),
			"mypermset",
			"with collection scalar true",
			&PermissionSet{
				BundleableBase: BundleableBase{
					Name: "mypermset",
				},
				CollectionRefs: CollectionPermissionMap{
					"uesio/core.user": {
						Read:   true,
						Create: true,
						Edit:   true,
						Delete: true,
					},
				},
			},
		},
		{
			[]byte(withCollectionScalarFalse),
			"mypermset",
			"with collection scalar false",
			&PermissionSet{
				BundleableBase: BundleableBase{
					Name: "mypermset",
				},
				CollectionRefs: CollectionPermissionMap{},
			},
		},
		{
			[]byte(withCollectionBlank),
			"mypermset",
			"with collection scalar blank",
			&PermissionSet{
				BundleableBase: BundleableBase{
					Name: "mypermset",
				},
				CollectionRefs: CollectionPermissionMap{
					"uesio/core.user": {
						Read:   true,
						Create: true,
						Edit:   true,
						Delete: true,
					},
				},
			},
		},
		{
			[]byte(withCollectionNull),
			"mypermset",
			"with collection scalar null",
			&PermissionSet{
				BundleableBase: BundleableBase{
					Name: "mypermset",
				},
				CollectionRefs: CollectionPermissionMap{
					"uesio/core.user": {
						Read:   true,
						Create: true,
						Edit:   true,
						Delete: true,
					},
				},
			},
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			permSet := &PermissionSet{
				BundleableBase: BundleableBase{
					Name: tc.name,
				},
			}
			err := yaml.Unmarshal(tc.yamlText, permSet)
			if err != nil {
				t.Errorf("Unexpected failure unmarshalling yaml: %s", err.Error())
			}
			assert.Equal(t, permSet, tc.expect)
		})
	}
}

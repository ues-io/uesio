package meta

import (
	"testing"

	"github.com/google/go-cmp/cmp"
	"gopkg.in/yaml.v3"
)

func TestUnmarshalYAML(t *testing.T) {

	yml := `
uesio/core.bulkjob: true
uesio/core.bulkbatch:
uesio/core.featureflagassignment:
  read: true
  create: false
  edit: false
  delete: true
`

	collectionPermissionMap := CollectionPermissionMap{}
	data := []byte(yml)
	err := yaml.Unmarshal(data, &collectionPermissionMap)

	if err != nil {
		t.Error(err)
	}

	collectionPermissionMapNode := yaml.Node{Kind: yaml.MappingNode}
	err = collectionPermissionMap.UnmarshalYAML(&collectionPermissionMapNode)

	if err != nil {
		t.Error(err)
	}

	if (len(collectionPermissionMap)) != 3 {
		t.Errorf("Bad Value")
	}

	for collectionKey, collectionPermission := range collectionPermissionMap {

		switch collectionKey {
		//backward compatibility
		case "uesio/core.bulkjob":
			collectionPermissionExpected := CollectionPermission{Read: true, Create: true, Edit: true, Delete: true}

			if !cmp.Equal(collectionPermissionExpected, collectionPermission) {
				t.Errorf("Bad Value")
			}

		//Lazy developer
		case "uesio/core.bulkbatch":
			collectionPermissionExpected := CollectionPermission{Read: true, Create: true, Edit: true, Delete: true}

			if !cmp.Equal(collectionPermissionExpected, collectionPermission) {
				t.Errorf("Bad Value")
			}
		//new format
		case "uesio/core.featureflagassignment":
			collectionPermissionExpected := CollectionPermission{Read: true, Create: false, Edit: false, Delete: true}

			if !cmp.Equal(collectionPermissionExpected, collectionPermission) {
				t.Errorf("Bad Value")
			}
		}

	}

	t.Logf("Passed")

}

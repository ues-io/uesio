package meta

import (
	"strconv"
)

type PermissionSetCollection []*PermissionSet

var PERMISSIONSET_COLLECTION_NAME = "uesio/studio.permissionset"
var PERMISSIONSET_FOLDER_NAME = "permissionsets"
var PERMISSIONSET_FIELDS = StandardGetFields(&PermissionSet{})

func (pc *PermissionSetCollection) GetName() string {
	return PERMISSIONSET_COLLECTION_NAME
}

func (pc *PermissionSetCollection) GetBundleFolderName() string {
	return PERMISSIONSET_FOLDER_NAME
}

func (pc *PermissionSetCollection) GetFields() []string {
	return PERMISSIONSET_FIELDS
}

func (pc *PermissionSetCollection) NewItem() Item {
	return &PermissionSet{}
}

func (pc *PermissionSetCollection) AddItem(item Item) {
	*pc = append(*pc, item.(*PermissionSet))
}

func (pc *PermissionSetCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBasePermissionSet(namespace, StandardNameFromPath(path))
}

func (pc *PermissionSetCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (pc *PermissionSetCollection) Loop(iter GroupIterator) error {
	for index, p := range *pc {
		err := iter(p, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (pc *PermissionSetCollection) Len() int {
	return len(*pc)
}

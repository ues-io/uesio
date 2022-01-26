package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// PermissionSetCollection slice
type PermissionSetCollection []PermissionSet

// GetName function
func (pc *PermissionSetCollection) GetName() string {
	return "studio.permissionsets"
}

// GetFields function
func (pc *PermissionSetCollection) GetFields() []string {
	return StandardGetFields(&PermissionSet{})
}

// NewItem function
func (pc *PermissionSetCollection) NewItem() loadable.Item {
	*pc = append(*pc, PermissionSet{})
	return &(*pc)[len(*pc)-1]
}

// NewBundleableItemWithKey function
func (pc *PermissionSetCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	p, err := NewPermissionSet(key)
	if err != nil {
		return nil, err
	}
	*pc = append(*pc, *p)
	return &(*pc)[len(*pc)-1], nil
}

// GetKeyFromPath function
func (pc *PermissionSetCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
}

// GetItem function
func (pc *PermissionSetCollection) GetItem(index int) loadable.Item {
	return &(*pc)[index]
}

// Loop function
func (pc *PermissionSetCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *pc {
		err := iter(pc.GetItem(index), index)
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (pc *PermissionSetCollection) Len() int {
	return len(*pc)
}

// GetItems function
func (pc *PermissionSetCollection) GetItems() interface{} {
	return *pc
}

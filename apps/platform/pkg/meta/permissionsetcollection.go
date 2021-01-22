package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// PermissionSetCollection slice
type PermissionSetCollection []PermissionSet

// GetName function
func (pc *PermissionSetCollection) GetName() string {
	return "permissionsets"
}

// GetFields function
func (pc *PermissionSetCollection) GetFields() []string {
	return StandardGetFields(pc)
}

// NewItem function
func (pc *PermissionSetCollection) NewItem() loadable.Item {
	return &PermissionSet{}
}

// NewBundleableItem function
func (pc *PermissionSetCollection) NewBundleableItem() BundleableItem {
	return &PermissionSet{}
}

// NewBundleableItem function
func (pc *PermissionSetCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewPermissionSet(key)
}

// GetKeyFromPath function
func (pc *PermissionSetCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
}

// AddItem function
func (pc *PermissionSetCollection) AddItem(item loadable.Item) {
	*pc = append(*pc, *item.(*PermissionSet))
}

// GetItem function
func (pc *PermissionSetCollection) GetItem(index int) loadable.Item {
	return &(*pc)[index]
}

// Loop function
func (pc *PermissionSetCollection) Loop(iter func(item loadable.Item) error) error {
	for index := range *pc {
		err := iter(pc.GetItem(index))
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
	return pc
}

// Slice function
func (pc *PermissionSetCollection) Slice(start int, end int) {

}

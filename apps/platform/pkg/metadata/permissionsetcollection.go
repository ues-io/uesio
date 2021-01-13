package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// PermissionSetCollection slice
type PermissionSetCollection []PermissionSet

// GetName function
func (pc *PermissionSetCollection) GetName() string {
	return "permissionsets"
}

// GetFields function
func (pc *PermissionSetCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(pc)
}

// NewItem function
func (pc *PermissionSetCollection) NewItem() adapters.LoadableItem {
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
func (pc *PermissionSetCollection) AddItem(item adapters.LoadableItem) {
	*pc = append(*pc, *item.(*PermissionSet))
}

// GetItem function
func (pc *PermissionSetCollection) GetItem(index int) adapters.LoadableItem {
	actual := *pc
	return &actual[index]
}

// Loop function
func (pc *PermissionSetCollection) Loop(iter func(item adapters.LoadableItem) error) error {
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

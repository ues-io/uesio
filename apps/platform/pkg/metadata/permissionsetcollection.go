package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// PermissionSetCollection slice
type PermissionSetCollection []PermissionSet

// GetName function
func (pc *PermissionSetCollection) GetName() string {
	return "permissionsets"
}

// GetFields function
func (pc *PermissionSetCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(pc)
}

// NewItem function
func (pc *PermissionSetCollection) NewItem() LoadableItem {
	return &PermissionSet{}
}

// NewBundleableItem function
func (pc *PermissionSetCollection) NewBundleableItem(key string) (BundleableItem, error) {
	return NewPermissionSet(key)
}

// GetKeyPrefix function
func (pc *PermissionSetCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (pc *PermissionSetCollection) AddItem(item LoadableItem) {
	*pc = append(*pc, *item.(*PermissionSet))
}

// GetItem function
func (pc *PermissionSetCollection) GetItem(index int) LoadableItem {
	actual := *pc
	return &actual[index]
}

// Loop function
func (pc *PermissionSetCollection) Loop(iter func(item LoadableItem) error) error {
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

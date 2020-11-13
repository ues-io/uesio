package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// PermissionSetCollection slice
type PermissionSetCollection []PermissionSet

// GetName function
func (pc *PermissionSetCollection) GetName() string {
	return "permissionsets"
}

// GetFields function
func (pc *PermissionSetCollection) GetFields() []string {
	return []string{"id"}
}

// NewItem function
func (pc *PermissionSetCollection) NewItem(key string) (BundleableItem, error) {
	return NewPermissionSet(key)
}

// GetKeyPrefix function
func (pc *PermissionSetCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (pc *PermissionSetCollection) AddItem(item BundleableItem) {
}

// UnMarshal function
func (pc *PermissionSetCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(pc, data)
}

// Marshal function
func (pc *PermissionSetCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(pc)
}

// GetItem function
func (pc *PermissionSetCollection) GetItem(index int) CollectionableItem {
	actual := *pc
	return &actual[index]
}

// Loop function
func (pc *PermissionSetCollection) Loop(iter func(item CollectionableItem) error) error {
	for _, item := range *pc {
		err := iter(&item)
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

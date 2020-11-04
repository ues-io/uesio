package metadata

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

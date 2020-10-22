package metadata

// BundleCollection slice
type BundleCollection []Bundle

// GetName function
func (bc *BundleCollection) GetName() string {
	return "bundles"
}

// GetFields function
func (bc *BundleCollection) GetFields() []string {
	return []string{"id", "major", "minor", "patch", "namespace", "description"}
}

// UnMarshal function
func (bc *BundleCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(bc, data)
}

// Marshal function
func (bc *BundleCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(bc)
}

// GetItem function
func (bc *BundleCollection) GetItem(index int) CollectionableItem {
	actual := *bc
	return &actual[index]
}

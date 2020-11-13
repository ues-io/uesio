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

// Loop function
func (bc *BundleCollection) Loop(iter func(item CollectionableItem) error) error {
	for _, item := range *bc {
		err := iter(&item)
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (bc *BundleCollection) Len() int {
	return len(*bc)
}

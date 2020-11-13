package metadata

// BundleDependencyCollection slice
type BundleDependencyCollection []BundleDependency

// GetName function
func (bc *BundleDependencyCollection) GetName() string {
	return "bundledependencies"
}

// GetFields function
func (bc *BundleDependencyCollection) GetFields() []string {
	return []string{"id", "workspaceid", "bundlename", "bundleversion"}
}

// UnMarshal function
func (bc *BundleDependencyCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(bc, data)
}

// Marshal function
func (bc *BundleDependencyCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(bc)
}

// GetItem function
func (bc *BundleDependencyCollection) GetItem(index int) CollectionableItem {
	actual := *bc
	return &actual[index]
}

// Loop function
func (bc *BundleDependencyCollection) Loop(iter func(item CollectionableItem) error) error {
	for _, item := range *bc {
		err := iter(&item)
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (bc *BundleDependencyCollection) Len() int {
	return len(*bc)
}

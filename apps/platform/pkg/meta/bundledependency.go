package meta

// BundleDependency struct
type BundleDependency struct {
	ID            string `uesio:"uesio.id"`
	WorkspaceID   string `uesio:"uesio.workspaceid"`
	BundleName    string `uesio:"uesio.bundlename"`
	BundleVersion string `uesio:"uesio.bundleversion"`
}

// GetCollectionName function
func (b *BundleDependency) GetCollectionName() string {
	return b.GetCollection().GetName()
}

// GetCollection function
func (b *BundleDependency) GetCollection() CollectionableGroup {
	var bc BundleDependencyCollection
	return &bc
}

// SetField function
func (b *BundleDependency) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(b, fieldName, value)
}

// GetField function
func (b *BundleDependency) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(b, fieldName)
}

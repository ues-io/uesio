package metadata

// Bundle struct
type Bundle struct {
	ID          string `uesio:"uesio.id"`
	Major       string `uesio:"uesio.major"`
	Minor       string `uesio:"uesio.minor"`
	Patch       string `uesio:"uesio.patch"`
	Namespace   string `uesio:"uesio.namespace"`
	Description string `uesio:"uesio.description"`
}

// GetCollectionName function
func (b *Bundle) GetCollectionName() string {
	return b.GetCollection().GetName()
}

// GetCollection function
func (b *Bundle) GetCollection() CollectionableGroup {
	var bc BundleCollection
	return &bc
}

// SetField function
func (b *Bundle) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(b, fieldName, value)
}

// GetField function
func (b *Bundle) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(b, fieldName)
}

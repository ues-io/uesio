package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

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

// GetConditions function
func (b *Bundle) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.id",
			Value: b.ID,
		},
	}, nil
}

// GetKey function
func (b *Bundle) GetKey() string {
	return b.ID
}

// GetNamespace function
func (b *Bundle) GetNamespace() string {
	return ""
}

// SetNamespace function
func (b *Bundle) SetNamespace(namespace string) {

}

// SetWorkspace function
func (b *Bundle) SetWorkspace(workspace string) {

}

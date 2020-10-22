package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// Bundle struct
type BundleDependency struct {
	ID          string `uesio:"uesio.id"`
	WorkspaceID string `uesio:"uesio.workspaceid"`
	BundleID    string `uesio:"uesio.bundleid"`
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

// GetConditions function
func (b *BundleDependency) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.id",
			Value: b.ID,
		},
	}, nil
}

// GetKey function
func (b *BundleDependency) GetKey() string {
	return b.ID
}

// GetNamespace function
func (b *BundleDependency) GetNamespace() string {
	return ""
}

// SetNamespace function
func (b *BundleDependency) SetNamespace(namespace string) {

}

// SetWorkspace function
func (b *BundleDependency) SetWorkspace(workspace string) {

}

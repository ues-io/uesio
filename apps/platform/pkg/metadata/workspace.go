package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// Workspace struct
type Workspace struct {
	ID        string `uesio:"uesio.id"`
	Name      string `uesio:"uesio.name"`
	Namespace string `uesio:"-"`
	AppRef    string `uesio:"uesio.appid"`
	App       App    `uesio:"uesio.app"`
}

// GetCollectionName function
func (w *Workspace) GetCollectionName() string {
	return w.GetCollection().GetName()
}

// GetCollection function
func (w *Workspace) GetCollection() CollectionableGroup {
	var wc WorkspaceCollection
	return &wc
}

// GetConditions function
func (w *Workspace) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.name",
			Value: w.Name,
		},
	}, nil
}

// GetKey function
func (w *Workspace) GetKey() string {
	return w.ID
}

// GetNamespace function
func (w *Workspace) GetNamespace() string {
	return w.Namespace
}

// SetNamespace function
func (w *Workspace) SetNamespace(namespace string) {
	w.Namespace = namespace
}

// SetWorkspace function
func (w *Workspace) SetWorkspace(workspace string) {

}

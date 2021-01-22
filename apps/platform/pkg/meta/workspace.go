package meta

// Workspace struct
type Workspace struct {
	ID          string         `uesio:"uesio.id"`
	Name        string         `uesio:"uesio.name"`
	Namespace   string         `uesio:"-"`
	AppRef      string         `uesio:"uesio.appid"`
	App         App            `uesio:"uesio.app"`
	Permissions *PermissionSet `uesio:"-"`
	bundleDef   *BundleDef
}

// SetAppBundle function
func (w *Workspace) SetAppBundle(bundleDef *BundleDef) {
	w.bundleDef = bundleDef
}

// GetAppBundle function
func (w *Workspace) GetAppBundle() *BundleDef {
	return w.bundleDef
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

// SetField function
func (w *Workspace) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(w, fieldName, value)
}

// GetField function
func (w *Workspace) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(w, fieldName)
}

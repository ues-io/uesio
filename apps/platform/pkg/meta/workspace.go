package meta

// Workspace struct
type Workspace struct {
	ID             string         `uesio:"studio.id"`
	Name           string         `uesio:"studio.name"`
	Namespace      string         `uesio:"-"`
	LoginRoute     string         `uesio:"studio.loginroute"`
	HomeRoute      string         `uesio:"studio.homeroute"`
	DefaultProfile string         `uesio:"studio.defaultprofile"`
	DefaultTheme   string         `uesio:"studio.defaulttheme"`
	PublicProfile  string         `uesio:"studio.publicprofile"`
	App            *App           `uesio:"studio.app"`
	Permissions    *PermissionSet `uesio:"-"`
	bundleDef      *BundleDef
	itemMeta       *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy      *User     `yaml:"-" uesio:"studio.createdby"`
	UpdatedBy      *User     `yaml:"-" uesio:"studio.updatedby"`
	UpdatedAt      float64   `yaml:"-" uesio:"studio.updatedat"`
	CreatedAt      float64   `yaml:"-" uesio:"studio.createdat"`
}

func (w *Workspace) GetAppID() string {
	if w.App == nil {
		return ""
	}
	return w.App.ID
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

// Loop function
func (w *Workspace) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(w, iter)
}

// GetItemMeta function
func (w *Workspace) GetItemMeta() *ItemMeta {
	return w.itemMeta
}

// SetItemMeta function
func (w *Workspace) SetItemMeta(itemMeta *ItemMeta) {
	w.itemMeta = itemMeta
}

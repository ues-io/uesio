package meta

type Workspace struct {
	ID            string         `uesio:"uesio/core.id"`
	UniqueKey     string         `yaml:"-" uesio:"uesio/core.uniquekey"`
	Name          string         `uesio:"uesio/studio.name"`
	LoginRoute    string         `uesio:"uesio/studio.loginroute"`
	HomeRoute     string         `uesio:"uesio/studio.homeroute"`
	DefaultTheme  string         `uesio:"uesio/studio.defaulttheme"`
	PublicProfile string         `uesio:"uesio/studio.publicprofile"`
	App           *App           `uesio:"uesio/studio.app"`
	Permissions   *PermissionSet `uesio:"-"`
	bundleDef     *BundleDef
	itemMeta      *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy     *User     `yaml:"-" uesio:"uesio/core.createdby"`
	Owner         *User     `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy     *User     `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt     int64     `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt     int64     `yaml:"-" uesio:"uesio/core.createdat"`
}

func (w *Workspace) GetAppFullName() string {
	if w.App == nil {
		return ""
	}
	return w.App.UniqueKey
}

func (w *Workspace) SetAppBundle(bundleDef *BundleDef) {
	w.bundleDef = bundleDef
}

func (w *Workspace) GetAppBundle() *BundleDef {
	return w.bundleDef
}

func (w *Workspace) GetCollectionName() string {
	return w.GetCollection().GetName()
}

func (w *Workspace) GetCollection() CollectionableGroup {
	var wc WorkspaceCollection
	return &wc
}

func (w *Workspace) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(w, fieldName, value)
}

func (w *Workspace) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(w, fieldName)
}

func (w *Workspace) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(w, iter)
}

func (w *Workspace) Len() int {
	return StandardItemLen(w)
}

func (w *Workspace) GetItemMeta() *ItemMeta {
	return w.itemMeta
}

func (w *Workspace) SetItemMeta(itemMeta *ItemMeta) {
	w.itemMeta = itemMeta
}

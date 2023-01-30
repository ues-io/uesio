package meta

type Workspace struct {
	BuiltIn       `yaml:",inline"`
	Name          string         `json:"uesio/studio.name"`
	LoginRoute    string         `json:"uesio/studio.loginroute"`
	HomeRoute     string         `json:"uesio/studio.homeroute"`
	DefaultTheme  string         `json:"uesio/studio.defaulttheme"`
	PublicProfile string         `json:"uesio/studio.publicprofile"`
	App           *App           `json:"uesio/studio.app"`
	Permissions   *PermissionSet `json:"-"`
	bundleDef     *BundleDef
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
	return WORKSPACE_COLLECTION_NAME
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

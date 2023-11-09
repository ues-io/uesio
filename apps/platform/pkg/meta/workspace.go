package meta

import "errors"

type Workspace struct {
	BuiltIn     `yaml:",inline"`
	Name        string `json:"uesio/studio.name"`
	AppSettings `yaml:",inline"`
	App         *App `json:"uesio/studio.app"`
	bundleDef   *BundleDef
}

func (w *Workspace) GetAppFullName() (string, error) {
	app, err := w.GetApp()
	if err != nil {
		return "", err
	}
	return app.UniqueKey, nil
}

func (w *Workspace) GetApp() (*App, error) {
	if w.App == nil {
		return nil, errors.New("This workspace does not have an in-context application.")
	}
	return w.App, nil
}

func (w *Workspace) SetAppBundle(bundleDef *BundleDef) {
	w.bundleDef = bundleDef
}

func (w *Workspace) GetAppBundle() *BundleDef {
	return w.bundleDef
}

func (w *Workspace) GetCollection() CollectionableGroup {
	return &WorkspaceCollection{}
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

func (w *Workspace) UnmarshalJSON(data []byte) error {
	type alias Workspace
	return refScanner((*alias)(w), data)
}

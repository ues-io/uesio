package meta

import (
	"errors"
	"strings"
)

// NewRoute function
func NewRoute(key string) (*Route, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid Route Key: " + key)
	}
	return &Route{
		Namespace: keyArray[0],
		Name:      keyArray[1],
	}, nil
}

// Route struct
type Route struct {
	ID        string            `yaml:"-" uesio:"studio.id"`
	Name      string            `uesio:"studio.name"`
	Namespace string            `yaml:"-" uesio:"-"`
	Path      string            `yaml:"path" uesio:"studio.path"`
	ViewRef   string            `yaml:"view" uesio:"studio.view"`
	Params    map[string]string `yaml:"-" uesio:"-"`
	Workspace string            `yaml:"-" uesio:"studio.workspaceid"`
	ThemeRef  string            `yaml:"theme" uesio:"studio.theme"`
	itemMeta  *ItemMeta         `yaml:"-" uesio:"-"`
	CreatedBy *User             `yaml:"-" uesio:"studio.createdby"`
	UpdatedBy *User             `yaml:"-" uesio:"studio.updatedby"`
	UpdatedAt int64             `yaml:"-" uesio:"studio.updatedat"`
	CreatedAt int64             `yaml:"-" uesio:"studio.createdat"`
}

// GetCollectionName function
func (r *Route) GetCollectionName() string {
	return r.GetBundleGroup().GetName()
}

// GetCollection function
func (r *Route) GetCollection() CollectionableGroup {
	var rc RouteCollection
	return &rc
}

// GetConditions function
func (r *Route) GetConditions() map[string]string {
	return map[string]string{
		"studio.name": r.Name,
	}
}

// GetBundleGroup function
func (r *Route) GetBundleGroup() BundleableGroup {
	var rc RouteCollection
	return &rc
}

// GetKey function
func (r *Route) GetKey() string {
	return r.Namespace + "." + r.Name
}

// GetPath function
func (r *Route) GetPath() string {
	return r.GetKey() + ".yaml"
}

// GetPermChecker function
func (r *Route) GetPermChecker() *PermissionSet {
	key := r.GetKey()
	return &PermissionSet{
		RouteRefs: map[string]bool{
			key: true,
		},
	}
}

// SetField function
func (r *Route) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(r, fieldName, value)
}

// GetField function
func (r *Route) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(r, fieldName)
}

// GetNamespace function
func (r *Route) GetNamespace() string {
	return r.Namespace
}

// SetNamespace function
func (r *Route) SetNamespace(namespace string) {
	r.Namespace = namespace
}

// SetWorkspace function
func (r *Route) SetWorkspace(workspace string) {
	r.Workspace = workspace
}

// Loop function
func (r *Route) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(r, iter)
}

// Len function
func (r *Route) Len() int {
	return StandardItemLen(r)
}

// GetItemMeta function
func (r *Route) GetItemMeta() *ItemMeta {
	return r.itemMeta
}

// SetItemMeta function
func (r *Route) SetItemMeta(itemMeta *ItemMeta) {
	r.itemMeta = itemMeta
}

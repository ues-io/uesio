package meta

import (
	"errors"
	"fmt"
	"strings"

	"github.com/humandad/yaml"
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
	ID         string            `yaml:"-" uesio:"uesio/uesio.id"`
	Name       string            `uesio:"uesio/studio.name"`
	Namespace  string            `yaml:"-" uesio:"-"`
	Path       string            `yaml:"path" uesio:"uesio/studio.path"`
	ViewType   string            `yaml:"viewtype" uesio:"uesio/studio.viewtype"`
	ViewRef    string            `yaml:"view" uesio:"uesio/studio.view"`
	Collection string            `yaml:"collection" uesio:"uesio/studio.collection"`
	Params     map[string]string `yaml:"-" uesio:"-"`
	Workspace  *Workspace        `yaml:"-" uesio:"uesio/studio.workspace"`
	ThemeRef   string            `yaml:"theme" uesio:"uesio/studio.theme"`
	itemMeta   *ItemMeta         `yaml:"-" uesio:"-"`
	CreatedBy  *User             `yaml:"-" uesio:"uesio/uesio.createdby"`
	Owner      *User             `yaml:"-" uesio:"uesio/uesio.owner"`
	UpdatedBy  *User             `yaml:"-" uesio:"uesio/uesio.updatedby"`
	UpdatedAt  int64             `yaml:"-" uesio:"uesio/uesio.updatedat"`
	CreatedAt  int64             `yaml:"-" uesio:"uesio/uesio.createdat"`
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

func (r *Route) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s", workspace, r.Name)
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
	return r.Name + ".yaml"
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
	r.Workspace = &Workspace{
		ID: workspace,
	}
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

func (r *Route) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, r.Name)
	if err != nil {
		return err
	}
	return node.Decode(r)
}

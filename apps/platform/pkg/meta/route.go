package meta

import (
	"errors"
	"fmt"
	"time"

	"gopkg.in/yaml.v3"
)

func NewRoute(key string) (*Route, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Invalid Route Key: " + key)
	}
	return &Route{
		Namespace: namespace,
		Name:      name,
	}, nil
}

type Route struct {
	ID         string            `yaml:"-" json:"uesio/core.id"`
	UniqueKey  string            `yaml:"-" json:"uesio/core.uniquekey"`
	Name       string            `yaml:"name" json:"uesio/studio.name"`
	Namespace  string            `yaml:"-" json:"-"`
	Path       string            `yaml:"path" json:"uesio/studio.path"`
	ViewType   string            `yaml:"viewtype,omitempty" json:"uesio/studio.viewtype"`
	ViewRef    string            `yaml:"view" json:"uesio/studio.view"`
	Collection string            `yaml:"collection,omitempty" json:"uesio/studio.collection"`
	Params     map[string]string `yaml:"params,omitempty" json:"uesio/studio.params"`
	Workspace  *Workspace        `yaml:"-" json:"uesio/studio.workspace"`
	ThemeRef   string            `yaml:"theme" json:"uesio/studio.theme"`
	itemMeta   *ItemMeta         `yaml:"-" json:"-"`
	CreatedBy  *User             `yaml:"-" json:"uesio/core.createdby"`
	Owner      *User             `yaml:"-" json:"uesio/core.owner"`
	UpdatedBy  *User             `yaml:"-" json:"uesio/core.updatedby"`
	UpdatedAt  int64             `yaml:"-" json:"uesio/core.updatedat"`
	CreatedAt  int64             `yaml:"-" json:"uesio/core.createdat"`
	Public     bool              `yaml:"public,omitempty" json:"uesio/studio.public"`
}

type RouteWrapper Route

func (r *Route) GetCollectionName() string {
	return r.GetBundleGroup().GetName()
}

func (r *Route) GetCollection() CollectionableGroup {
	return &RouteCollection{}
}

func (r *Route) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, r.Name)
}

func (r *Route) GetBundleGroup() BundleableGroup {
	return &RouteCollection{}
}

func (r *Route) GetKey() string {
	return fmt.Sprintf("%s.%s", r.Namespace, r.Name)
}

func (r *Route) GetPath() string {
	return r.Name + ".yaml"
}

func (r *Route) GetPermChecker() *PermissionSet {
	key := r.GetKey()
	return &PermissionSet{
		RouteRefs: map[string]bool{
			key: true,
		},
	}
}

func (r *Route) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(r, fieldName, value)
}

func (r *Route) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(r, fieldName)
}

func (r *Route) GetNamespace() string {
	return r.Namespace
}

func (r *Route) SetNamespace(namespace string) {
	r.Namespace = namespace
}

func (r *Route) SetModified(mod time.Time) {
	r.UpdatedAt = mod.UnixMilli()
}

func (r *Route) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(r, iter)
}

func (r *Route) Len() int {
	return StandardItemLen(r)
}

func (r *Route) GetItemMeta() *ItemMeta {
	return r.itemMeta
}

func (r *Route) SetItemMeta(itemMeta *ItemMeta) {
	r.itemMeta = itemMeta
}

func (r *Route) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, r.Name)
	if err != nil {
		return err
	}
	err = validateRequiredMetadataItem(node, "view")
	if err != nil {
		return err
	}
	err = setDefaultValue(node, "theme", "uesio/core.default")
	if err != nil {
		return err
	}
	err = validateRequiredMetadataItem(node, "theme")
	if err != nil {
		return err
	}
	return node.Decode((*RouteWrapper)(r))
}

func (r *Route) IsPublic() bool {
	return r.Public
}

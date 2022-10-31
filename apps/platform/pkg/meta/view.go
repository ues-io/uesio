package meta

import (
	"errors"
	"fmt"
	"time"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

type View struct {
	ID         string     `yaml:"-" json:"uesio/core.id"`
	UniqueKey  string     `yaml:"-" json:"uesio/core.uniquekey"`
	Name       string     `yaml:"name" json:"uesio/studio.name"`
	Namespace  string     `yaml:"-" json:"-"`
	Definition yaml.Node  `yaml:"definition" json:"uesio/studio.definition"`
	Workspace  *Workspace `yaml:"-" json:"uesio/studio.workspace"`
	itemMeta   *ItemMeta  `yaml:"-" json:"-"`
	CreatedBy  *User      `yaml:"-" json:"uesio/core.createdby"`
	Owner      *User      `yaml:"-" json:"uesio/core.owner"`
	UpdatedBy  *User      `yaml:"-" json:"uesio/core.updatedby"`
	UpdatedAt  int64      `yaml:"-" json:"uesio/core.updatedat"`
	CreatedAt  int64      `yaml:"-" json:"uesio/core.createdat"`
	Public     bool       `yaml:"public,omitempty" json:"uesio/studio.public"`
}

type ViewWrapper View

func (v *View) GetBytes() ([]byte, error) {
	return gojay.MarshalJSONObject(v)
}

func (v *View) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddObjectKey("definition", (*YAMLDefinition)(&v.Definition))
	enc.AddStringKey("namespace", v.Namespace)
	enc.AddStringKey("name", v.Name)
}

func (v *View) IsNil() bool {
	return v == nil
}

func NewView(key string) (*View, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for View: " + key)
	}
	return &View{
		Name:      name,
		Namespace: namespace,
	}, nil
}

func NewViews(keys map[string]bool) ([]BundleableItem, error) {
	items := []BundleableItem{}

	for key := range keys {
		newView, err := NewView(key)
		if err != nil {
			return nil, err
		}
		items = append(items, newView)
	}

	return items, nil
}

func (v *View) GetCollectionName() string {
	return v.GetBundleGroup().GetName()
}

func (v *View) GetCollection() CollectionableGroup {
	var vc ViewCollection
	return &vc
}

func (v *View) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, v.Name)
}

func (v *View) GetBundleGroup() BundleableGroup {
	var vc ViewCollection
	return &vc
}

func (v *View) GetKey() string {
	return fmt.Sprintf("%s.%s", v.Namespace, v.Name)
}

func (v *View) GetPath() string {
	return v.Name + ".yaml"
}

func (v *View) GetPermChecker() *PermissionSet {
	key := v.GetKey()
	return &PermissionSet{
		ViewRefs: map[string]bool{
			key: true,
		},
	}
}

func (v *View) SetField(fieldName string, value interface{}) error {
	if fieldName == "uesio/studio.definition" {
		var definition yaml.Node
		if value != nil {
			err := yaml.Unmarshal([]byte(value.(string)), &definition)
			if err != nil {
				return err
			}
			if len(definition.Content) > 0 {
				v.Definition = *definition.Content[0]
			}
		}
		return nil
	}
	return StandardFieldSet(v, fieldName, value)
}

func (v *View) GetField(fieldName string) (interface{}, error) {
	if fieldName == "uesio/studio.definition" {
		bytes, err := yaml.Marshal(&v.Definition)
		if err != nil {
			return nil, err
		}
		return string(bytes), nil
	}
	return StandardFieldGet(v, fieldName)
}

func (v *View) GetNamespace() string {
	return v.Namespace
}

func (v *View) SetNamespace(namespace string) {
	v.Namespace = namespace
}

func (v *View) SetModified(mod time.Time) {
	v.UpdatedAt = mod.UnixMilli()
}

func (v *View) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(v, iter)
}

func (v *View) Len() int {
	return StandardItemLen(v)
}

func (v *View) GetItemMeta() *ItemMeta {
	return v.itemMeta
}

func (v *View) SetItemMeta(itemMeta *ItemMeta) {
	v.itemMeta = itemMeta
}

func (v *View) IsPublic() bool {
	return v.Public
}

func (v *View) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, v.Name)
	if err != nil {
		return err
	}
	return node.Decode((*ViewWrapper)(v))
}

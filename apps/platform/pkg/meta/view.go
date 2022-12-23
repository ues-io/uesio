package meta

import (
	"errors"
	"fmt"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

type View struct {
	Name       string    `yaml:"name" json:"uesio/studio.name"`
	Definition yaml.Node `yaml:"definition" json:"uesio/studio.definition"`
	BuiltIn
	BundleableBase `yaml:",inline"`
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
	return NewBaseView(namespace, name), nil
}

func NewBaseView(namespace, name string) *View {
	return &View{
		Name: name,
		BundleableBase: BundleableBase{
			Namespace: namespace,
		},
	}
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
	return &ViewCollection{}
}

func (v *View) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, v.Name)
}

func (v *View) GetBundleGroup() BundleableGroup {
	return &ViewCollection{}
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

func (v *View) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(v, iter)
}

func (v *View) Len() int {
	return StandardItemLen(v)
}

func (v *View) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, v.Name)
	if err != nil {
		return err
	}
	return node.Decode((*ViewWrapper)(v))
}

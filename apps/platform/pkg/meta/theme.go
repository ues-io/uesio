package meta

import (
	"errors"
	"fmt"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

type Theme struct {
	Name       string    `yaml:"name" json:"uesio/studio.name"`
	Definition yaml.Node `yaml:"definition" json:"uesio/studio.definition"`
	BuiltIn
	BundleableBase `yaml:",inline"`
}

type ThemeWrapper Theme

func (t *Theme) GetBytes() ([]byte, error) {
	return gojay.MarshalJSONObject(t)
}

func (t *Theme) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddObjectKey("definition", (*YAMLDefinition)(&t.Definition))
	enc.AddStringKey("namespace", t.Namespace)
	enc.AddStringKey("name", t.Name)
}

func (t *Theme) IsNil() bool {
	return t == nil
}

func NewTheme(key string) (*Theme, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Theme: " + key)
	}
	return &Theme{
		Name: name,
		BundleableBase: BundleableBase{
			Namespace: namespace,
		},
	}, nil
}

func NewThemes(keys map[string]bool) ([]BundleableItem, error) {
	items := []BundleableItem{}

	for key := range keys {
		newTheme, err := NewTheme(key)
		if err != nil {
			return nil, err
		}
		items = append(items, newTheme)
	}

	return items, nil
}

func (t *Theme) GetCollectionName() string {
	return t.GetBundleGroup().GetName()
}

func (t *Theme) GetCollection() CollectionableGroup {
	return &ThemeCollection{}
}

func (t *Theme) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, t.Name)
}

func (t *Theme) GetBundleGroup() BundleableGroup {
	return &ThemeCollection{}
}

func (t *Theme) GetKey() string {
	return fmt.Sprintf("%s.%s", t.Namespace, t.Name)
}

func (t *Theme) GetPath() string {
	return t.Name + ".yaml"
}

func (t *Theme) GetPermChecker() *PermissionSet {
	return nil
}

func (t *Theme) SetField(fieldName string, value interface{}) error {
	if fieldName == "uesio/studio.definition" {
		var definition yaml.Node
		if value != nil {
			err := yaml.Unmarshal([]byte(value.(string)), &definition)
			if err != nil {
				return err
			}
			if len(definition.Content) > 0 {
				t.Definition = *definition.Content[0]
			}
		}
		return nil
	}
	return StandardFieldSet(t, fieldName, value)
}

func (t *Theme) GetField(fieldName string) (interface{}, error) {
	if fieldName == "uesio/studio.definition" {
		bytes, err := yaml.Marshal(&t.Definition)
		if err != nil {
			return nil, err
		}
		return string(bytes), nil
	}
	return StandardFieldGet(t, fieldName)
}

func (t *Theme) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(t, iter)
}

func (t *Theme) Len() int {
	return StandardItemLen(t)
}

func (t *Theme) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, t.Name)
	if err != nil {
		return err
	}
	return node.Decode((*ThemeWrapper)(t))
}

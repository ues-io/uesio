package meta

import (
	"fmt"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

type Theme struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Definition     *YAMLDef `yaml:"definition" json:"uesio/studio.definition"`
}

type ThemeWrapper Theme

func (t *Theme) GetBytes() ([]byte, error) {
	return gojay.MarshalJSONObject(t)
}

func (t *Theme) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddObjectKey("definition", (*YAMLtoJSONMap)(t.Definition))
	enc.AddStringKey("namespace", t.Namespace)
	enc.AddStringKey("name", t.Name)
}

func (t *Theme) IsNil() bool {
	return t == nil
}

func NewTheme(key string) (*Theme, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, fmt.Errorf("bad key for theme: %s", key)
	}
	return NewBaseTheme(namespace, name), nil
}

func NewBaseTheme(namespace, name string) *Theme {
	return &Theme{BundleableBase: NewBase(namespace, name)}
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

func (t *Theme) GetCollection() CollectionableGroup {
	return &ThemeCollection{}
}

func (t *Theme) GetCollectionName() string {
	return THEME_COLLECTION_NAME
}

func (t *Theme) GetBundleFolderName() string {
	return THEME_FOLDER_NAME
}

func (t *Theme) SetField(fieldName string, value any) error {
	return StandardFieldSet(t, fieldName, value)
}

func (t *Theme) GetField(fieldName string) (any, error) {
	return StandardFieldGet(t, fieldName)
}

func (t *Theme) Loop(iter func(string, any) error) error {
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

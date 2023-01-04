package meta

import (
	"errors"
	"fmt"
	"path/filepath"
	"strings"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

func NewComponentVariant(key string) (*ComponentVariant, error) {
	keyArray := strings.Split(key, ":")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid Variant Key: " + key)
	}
	namespace, name, err := ParseKey(keyArray[1])
	if err != nil {
		return nil, errors.New("Invalid Variant Key: " + key)
	}
	return NewBaseComponentVariant(keyArray[0], namespace, name), nil
}

func NewBaseComponentVariant(component, namespace, name string) *ComponentVariant {
	return &ComponentVariant{
		Component:      component,
		BundleableBase: NewBase(namespace, name),
	}
}

type ComponentVariant struct {
	Component  string    `yaml:"-" json:"uesio/studio.component"`
	Extends    string    `yaml:"extends,omitempty" json:"uesio/studio.extends"`
	Label      string    `yaml:"label" json:"uesio/studio.label"`
	Definition yaml.Node `yaml:"definition" json:"uesio/studio.definition"`
	BuiltIn
	BundleableBase `yaml:",inline"`
}

type ComponentVariantWrapper ComponentVariant

func (c *ComponentVariant) GetBytes() ([]byte, error) {
	return gojay.MarshalJSONObject(c)
}

func (c *ComponentVariant) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddObjectKey("definition", (*YAMLDefinition)(&c.Definition))
	enc.AddStringKey("extends", c.Extends)
	enc.AddStringKey("component", c.Component)
	enc.AddStringKey("namespace", c.Namespace)
	enc.AddStringKey("name", c.Name)
	enc.AddStringKey("label", c.Label)
}

func (c *ComponentVariant) IsNil() bool {
	return c == nil
}

func (c *ComponentVariant) GetBundleFolderName() string {
	return COMPONENTVARIANT_FOLDER_NAME
}

func (c *ComponentVariant) GetKey() string {
	return fmt.Sprintf("%s:%s.%s", c.Component, c.Namespace, c.Name)
}

func (c *ComponentVariant) GetPath() string {
	componentNamespace, componentName, _ := ParseKey(c.Component)
	nsUser, appName, _ := ParseNamespace(componentNamespace)
	return filepath.Join(nsUser, appName, componentName, c.Name) + ".yaml"
}

func (c *ComponentVariant) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s:%s", workspace, c.Component, c.Name)
}

func (c *ComponentVariant) GetCollectionName() string {
	return COMPONENTVARIANT_COLLECTION_NAME
}

func (v *ComponentVariant) SetField(fieldName string, value interface{}) error {
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

func (v *ComponentVariant) GetField(fieldName string) (interface{}, error) {
	if fieldName == "uesio/studio.definition" {
		bytes, err := yaml.Marshal(&v.Definition)
		if err != nil {
			return nil, err
		}
		return string(bytes), nil
	}
	return StandardFieldGet(v, fieldName)
}

func (c *ComponentVariant) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(c, iter)
}

func (c *ComponentVariant) Len() int {
	return StandardItemLen(c)
}

func (cv *ComponentVariant) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, cv.Name)
	if err != nil {
		return err
	}
	return node.Decode((*ComponentVariantWrapper)(cv))
}

package meta

import (
	"fmt"
	"path"
	"strings"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

func NewComponentVariant(key string) (*ComponentVariant, error) {
	keyArray := strings.Split(key, ":")
	if len(keyArray) != 2 {
		return nil, fmt.Errorf("invalid variant key: %s", key)
	}
	namespace, name, err := ParseKey(keyArray[1])
	if err != nil {
		return nil, fmt.Errorf("invalid variant key: %s", key)
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
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Component      string   `yaml:"-" json:"uesio/studio.component"`
	Extends        string   `yaml:"extends,omitempty" json:"uesio/studio.extends"`
	Definition     *YAMLDef `yaml:"definition" json:"uesio/studio.definition"`
	Variants       []string `yaml:"variants,omitempty" json:"uesio/studio.variants"`
}

type ComponentVariantWrapper ComponentVariant

func (c *ComponentVariant) GetBytes() ([]byte, error) {
	return gojay.MarshalJSONObject(c)
}

func (c *ComponentVariant) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddObjectKey("definition", (*YAMLtoJSONMap)(c.Definition))
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

func (c *ComponentVariant) GetExtendsKey() string {
	return fmt.Sprintf("%s:%s", c.Component, c.Extends)
}

func (c *ComponentVariant) GetPath() string {
	componentNamespace, componentName, _ := ParseKey(c.Component)
	nsUser, appName, _ := ParseNamespace(componentNamespace)
	return path.Join(nsUser, appName, componentName, c.Name) + ".yaml"
}

func (c *ComponentVariant) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s:%s", workspace, c.Component, c.Name)
}

func (c *ComponentVariant) GetCollectionName() string {
	return COMPONENTVARIANT_COLLECTION_NAME
}

func (c *ComponentVariant) GetCollection() CollectionableGroup {
	return &ComponentVariantCollection{}
}

func (v *ComponentVariant) SetField(fieldName string, value any) error {
	return StandardFieldSet(v, fieldName, value)
}

func (v *ComponentVariant) GetField(fieldName string) (any, error) {
	return StandardFieldGet(v, fieldName)
}

func (c *ComponentVariant) Loop(iter func(string, any) error) error {
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

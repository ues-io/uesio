package meta

import (
	"errors"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/francoispqt/gojay"
	"github.com/humandad/yaml"
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
	return &ComponentVariant{
		Component: keyArray[0],
		Name:      name,
		Namespace: namespace,
	}, nil
}

type ComponentVariant struct {
	ID         string     `yaml:"-" uesio:"uesio/core.id"`
	UniqueKey  string     `yaml:"-" uesio:"uesio/core.uniquekey"`
	Namespace  string     `yaml:"-" uesio:"-"`
	Workspace  *Workspace `yaml:"-" uesio:"uesio/studio.workspace"`
	Name       string     `yaml:"name" uesio:"uesio/studio.name"`
	Component  string     `yaml:"-" uesio:"uesio/studio.component"`
	Extends    string     `yaml:"extends" uesio:"uesio/studio.extends"`
	Label      string     `yaml:"label" uesio:"uesio/studio.label"`
	Definition yaml.Node  `yaml:"definition" uesio:"uesio/studio.definition"`
	itemMeta   *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy  *User      `yaml:"-" uesio:"uesio/core.createdby"`
	Owner      *User      `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy  *User      `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt  int64      `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt  int64      `yaml:"-" uesio:"uesio/core.createdat"`
	Public     bool       `yaml:"public,omitempty" uesio:"uesio/studio.public"`
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

func (c *ComponentVariant) GetBundleGroup() BundleableGroup {
	var cvc ComponentVariantCollection
	return &cvc
}

func (c *ComponentVariant) GetPermChecker() *PermissionSet {
	return nil
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

func (c *ComponentVariant) SetNamespace(namespace string) {
	c.Namespace = namespace
}

func (c *ComponentVariant) GetNamespace() string {
	return c.Namespace
}

func (c *ComponentVariant) SetModified(mod time.Time) {
	c.UpdatedAt = mod.UnixMilli()
}

func (c *ComponentVariant) GetCollectionName() string {
	return c.GetCollection().GetName()
}

func (c *ComponentVariant) GetCollection() CollectionableGroup {
	var sc ComponentVariantCollection
	return &sc
}

func (v *ComponentVariant) SetField(fieldName string, value interface{}) error {
	if fieldName == "uesio/studio.definition" {
		var definition yaml.Node
		err := yaml.Unmarshal([]byte(value.(string)), &definition)
		if err != nil {
			return err
		}
		if len(definition.Content) > 0 {
			v.Definition = *definition.Content[0]
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

func (c *ComponentVariant) GetItemMeta() *ItemMeta {
	return c.itemMeta
}

func (c *ComponentVariant) SetItemMeta(itemMeta *ItemMeta) {
	c.itemMeta = itemMeta
}

func (cv *ComponentVariant) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, cv.Name)
	if err != nil {
		return err
	}
	return node.Decode(cv)
}

func (cv *ComponentVariant) IsPublic() bool {
	return cv.Public
}

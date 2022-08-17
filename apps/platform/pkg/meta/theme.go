package meta

import (
	"errors"
	"fmt"
	"time"

	"github.com/francoispqt/gojay"
	"github.com/humandad/yaml"
)

type Theme struct {
	ID         string     `yaml:"-" uesio:"uesio/core.id"`
	UniqueKey  string     `yaml:"-" uesio:"uesio/core.uniquekey"`
	Name       string     `yaml:"name" uesio:"uesio/studio.name"`
	Namespace  string     `yaml:"-" uesio:"-"`
	Definition yaml.Node  `yaml:"definition" uesio:"uesio/studio.definition"`
	Workspace  *Workspace `yaml:"-" uesio:"uesio/studio.workspace"`
	itemMeta   *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy  *User      `yaml:"-" uesio:"uesio/core.createdby"`
	Owner      *User      `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy  *User      `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt  int64      `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt  int64      `yaml:"-" uesio:"uesio/core.createdat"`
	Public     bool       `yaml:"public,omitempty" uesio:"uesio/studio.public"`
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
		Name:      name,
		Namespace: namespace,
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
	var tc ThemeCollection
	return &tc
}

func (t *Theme) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, t.Name)
}

func (t *Theme) GetBundleGroup() BundleableGroup {
	var tc ThemeCollection
	return &tc
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
		err := yaml.Unmarshal([]byte(value.(string)), &definition)
		if err != nil {
			return err
		}
		if len(definition.Content) > 0 {
			t.Definition = *definition.Content[0]
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

func (t *Theme) GetNamespace() string {
	return t.Namespace
}

func (t *Theme) SetNamespace(namespace string) {
	t.Namespace = namespace
}

func (t *Theme) SetModified(mod time.Time) {
	t.UpdatedAt = mod.UnixMilli()
}

func (t *Theme) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(t, iter)
}

func (t *Theme) Len() int {
	return StandardItemLen(t)
}

func (t *Theme) GetItemMeta() *ItemMeta {
	return t.itemMeta
}

func (t *Theme) SetItemMeta(itemMeta *ItemMeta) {
	t.itemMeta = itemMeta
}

func (t *Theme) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, t.Name)
	if err != nil {
		return err
	}
	return node.Decode(t)
}

func (t *Theme) IsPublic() bool {
	return t.Public
}

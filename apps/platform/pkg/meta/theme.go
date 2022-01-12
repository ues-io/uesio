package meta

import (
	"fmt"

	"github.com/humandad/yaml"
)

// Theme struct
type Theme struct {
	ID         string     `yaml:"-" uesio:"uesio.id"`
	Name       string     `yaml:"name" uesio:"studio.name"`
	Namespace  string     `yaml:"-" uesio:"-"`
	Definition yaml.Node  `yaml:"definition" uesio:"studio.definition"`
	Workspace  *Workspace `yaml:"-" uesio:"studio.workspace"`
	itemMeta   *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy  *User      `yaml:"-" uesio:"uesio.createdby"`
	Owner      *User      `yaml:"-" uesio:"uesio.owner"`
	UpdatedBy  *User      `yaml:"-" uesio:"uesio.updatedby"`
	UpdatedAt  int64      `yaml:"-" uesio:"uesio.updatedat"`
	CreatedAt  int64      `yaml:"-" uesio:"uesio.createdat"`
}

// GetCollectionName function
func (t *Theme) GetCollectionName() string {
	return t.GetBundleGroup().GetName()
}

// GetCollection function
func (t *Theme) GetCollection() CollectionableGroup {
	var tc ThemeCollection
	return &tc
}

func (t *Theme) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s", workspace, t.Name)
}

// GetBundleGroup function
func (t *Theme) GetBundleGroup() BundleableGroup {
	var tc ThemeCollection
	return &tc
}

// GetKey function
func (t *Theme) GetKey() string {
	return t.Namespace + "." + t.Name
}

// GetPath function
func (t *Theme) GetPath() string {
	return t.GetKey() + ".yaml"
}

// GetPermChecker function
func (t *Theme) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (t *Theme) SetField(fieldName string, value interface{}) error {
	if fieldName == "studio.definition" {
		var definition yaml.Node
		err := yaml.Unmarshal([]byte(value.(string)), &definition)
		if err != nil {
			return err
		}
		t.Definition = *definition.Content[0]
		return nil
	}
	return StandardFieldSet(t, fieldName, value)
}

// GetField function
func (t *Theme) GetField(fieldName string) (interface{}, error) {
	if fieldName == "studio.definition" {
		bytes, err := yaml.Marshal(&t.Definition)
		if err != nil {
			return nil, err
		}
		return string(bytes), nil
	}
	return StandardFieldGet(t, fieldName)
}

// GetNamespace function
func (t *Theme) GetNamespace() string {
	return t.Namespace
}

// SetNamespace function
func (t *Theme) SetNamespace(namespace string) {
	t.Namespace = namespace
}

// SetWorkspace function
func (t *Theme) SetWorkspace(workspace string) {
	t.Workspace = &Workspace{
		ID: workspace,
	}
}

// Loop function
func (t *Theme) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(t, iter)
}

// Len function
func (t *Theme) Len() int {
	return StandardItemLen(t)
}

// GetItemMeta function
func (t *Theme) GetItemMeta() *ItemMeta {
	return t.itemMeta
}

// SetItemMeta function
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

package meta

import (
	"gopkg.in/yaml.v3"
)

// Theme struct
type Theme struct {
	ID         string    `yaml:"-" uesio:"studio.id"`
	Name       string    `yaml:"name" uesio:"studio.name"`
	Namespace  string    `yaml:"-" uesio:"-"`
	Definition yaml.Node `yaml:"definition" uesio:"studio.definition"`
	Workspace  string    `yaml:"-" uesio:"studio.workspaceid"`
	itemMeta   *ItemMeta `yaml:"-" uesio:"-"`
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

// GetConditions function
func (t *Theme) GetConditions() map[string]string {
	return map[string]string{
		"studio.name": t.Name,
	}
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
	t.Workspace = workspace
}

// Loop function
func (t *Theme) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(t, iter)
}

// GetItemMeta function
func (t *Theme) GetItemMeta() *ItemMeta {
	return t.itemMeta
}

// SetItemMeta function
func (t *Theme) SetItemMeta(itemMeta *ItemMeta) {
	t.itemMeta = itemMeta
}

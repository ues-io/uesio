package meta

import (
	"gopkg.in/yaml.v3"
)

//ThemeDefinition struct
type ThemeDefinition struct {
	Error     string `json:"error"`
	Info      string `json:"info"`
	Primary   string `json:"primary"`
	Secondary string `json:"secondary"`
	Success   string `json:"success"`
	Warning   string `json:"warning"`
}

// Theme struct
type Theme struct {
	ID         string          `yaml:"-" uesio:"studio.id"`
	Name       string          `yaml:"name" uesio:"studio.name"`
	Namespace  string          `yaml:"-" uesio:"-"`
	Definition ThemeDefinition `yaml:"definition" uesio:"studio.definition"`
	Workspace  string          `yaml:"-" uesio:"studio.workspaceid"`
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
		return yaml.Unmarshal([]byte(value.(string)), &t.Definition)
	}
	return StandardFieldSet(t, fieldName, value)
}

// GetField function
func (t *Theme) GetField(fieldName string) (interface{}, error) {
	if fieldName == "studio.definition" {
		bytes, err := yaml.Marshal(t.Definition)
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

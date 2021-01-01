package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"gopkg.in/yaml.v3"
)

// View struct
type View struct {
	ID           string                `yaml:"-" uesio:"uesio.id"`
	Name         string                `yaml:"name" uesio:"uesio.name"`
	Namespace    string                `yaml:"-" uesio:"-"`
	Definition   yaml.Node             `yaml:"definition" uesio:"uesio.definition"`
	Dependencies map[string]Dependency `yaml:"dependencies" uesio:"uesio.dependencies"`
	Workspace    string                `yaml:"-" uesio:"uesio.workspaceid"`
}

// Dependency struct
type Dependency map[string]interface{}

// GetCollectionName function
func (v *View) GetCollectionName() string {
	return v.GetBundleGroup().GetName()
}

// GetCollection function
func (v *View) GetCollection() CollectionableGroup {
	var vc ViewCollection
	return &vc
}

// GetConditions function
func (v *View) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.name",
			Value: v.Name,
		},
	}, nil
}

// GetBundleGroup function
func (v *View) GetBundleGroup() BundleableGroup {
	var vc ViewCollection
	return &vc
}

// GetKey function
func (v *View) GetKey() string {
	return v.Namespace + "." + v.Name
}

// GetPermChecker function
func (v *View) GetPermChecker() *PermissionSet {
	key := v.GetKey()
	return &PermissionSet{
		ViewRefs: map[string]bool{
			key: true,
		},
	}
}

// SetField function
func (v *View) SetField(fieldName string, value interface{}) error {
	if fieldName == "uesio.definition" {
		var definition yaml.Node
		err := yaml.Unmarshal([]byte(value.(string)), &definition)
		if err != nil {
			return err
		}
		v.Dependencies = map[string]Dependency{
			"componentpacks": map[string]interface{}{
				"material.main": nil,
				"sample.main":   nil,
			},
		}
		v.Definition = *definition.Content[0]
		return nil
	}
	if fieldName == "uesio.dependencies" {
		return nil
	}
	return StandardFieldSet(v, fieldName, value)
}

// GetField function
func (v *View) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(v, fieldName)
}

// GetNamespace function
func (v *View) GetNamespace() string {
	return v.Namespace
}

// SetNamespace function
func (v *View) SetNamespace(namespace string) {
	v.Namespace = namespace
}

// SetWorkspace function
func (v *View) SetWorkspace(workspace string) {
	v.Workspace = workspace
}

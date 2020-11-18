package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"gopkg.in/yaml.v3"
)

// View struct
type View struct {
	ID           string    `yaml:"-" uesio:"uesio.id"`
	Name         string    `yaml:"name" uesio:"uesio.name"`
	Namespace    string    `yaml:"-" uesio:"-"`
	Definition   yaml.Node `yaml:"definition" uesio:"-"`
	Dependencies yaml.Node `yaml:"dependencies" uesio:"-"`
	Workspace    string    `yaml:"-" uesio:"uesio.workspaceid"`
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

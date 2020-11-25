package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"gopkg.in/yaml.v3"
)

// Theme struct
type Theme struct {
	ID         string     `yaml:"-" uesio:"uesio.id"`
	Name       string     `yaml:"name" uesio:"uesio.name"`
	Namespace  string     `yaml:"-" uesio:"-"`
	Definition *yaml.Node `yaml:"definition" uesio:"-"`
	Workspace  string     `yaml:"-" uesio:"uesio.workspaceid"`
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
func (t *Theme) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.name",
			Value: t.Name,
		},
	}, nil
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

// GetPermChecker function
func (t *Theme) GetPermChecker() *PermissionSet {
	return nil
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

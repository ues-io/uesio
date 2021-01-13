package metadata

import "github.com/thecloudmasters/uesio/pkg/adapters"

// ComponentPack struct
type ComponentPack struct {
	Name       string                            `yaml:"name" uesio:"uesio.name"`
	Namespace  string                            `yaml:"namespace" uesio:"-"`
	Workspace  string                            `yaml:"-" uesio:"uesio.workspaceid"`
	Components map[string]*ComponentDependencies `yaml:"components" uesio:"uesio.components"`
}

type ComponentDependencies struct {
	ConfigValues []string `yaml:"configvalues"`
}

// GetCollectionName function
func (cp *ComponentPack) GetCollectionName() string {
	return cp.GetBundleGroup().GetName()
}

// GetCollection function
func (cp *ComponentPack) GetCollection() CollectionableGroup {
	var cpc ComponentPackCollection
	return &cpc
}

// GetConditions function
func (cp *ComponentPack) GetConditions() ([]adapters.LoadRequestCondition, error) {
	return []adapters.LoadRequestCondition{
		{
			Field: "uesio.name",
			Value: cp.Name,
		},
	}, nil
}

// GetBundleGroup function
func (cp *ComponentPack) GetBundleGroup() BundleableGroup {
	var cpc ComponentPackCollection
	return &cpc
}

// GetKey function
func (cp *ComponentPack) GetKey() string {
	return cp.Namespace + "." + cp.Name
}

// GetPath function
func (cp *ComponentPack) GetPath() string {
	return cp.GetKey() + ".yaml"
}

// GetPermChecker function
func (cp *ComponentPack) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (cp *ComponentPack) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(cp, fieldName, value)
}

// GetField function
func (cp *ComponentPack) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(cp, fieldName)
}

// GetNamespace function
func (cp *ComponentPack) GetNamespace() string {
	return cp.Namespace
}

// SetNamespace function
func (cp *ComponentPack) SetNamespace(namespace string) {
	cp.Namespace = namespace
}

// SetWorkspace function
func (cp *ComponentPack) SetWorkspace(workspace string) {
	cp.Workspace = workspace
}

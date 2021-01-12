package metadata

import "github.com/thecloudmasters/uesio/pkg/adapters"

// SelectListOption struct
type SelectListOption struct {
	Label string `uesio:"label"`
	Value string `uesio:"value"`
}

// SelectList struct
type SelectList struct {
	ID        string             `yaml:"-" uesio:"uesio.id"`
	Name      string             `yaml:"name" uesio:"uesio.name"`
	Namespace string             `yaml:"-" uesio:"-"`
	Options   []SelectListOption `yaml:"options" uesio:"uesio.options"`
	Workspace string             `yaml:"-" uesio:"uesio.workspaceid"`
}

// GetCollectionName function
func (sl *SelectList) GetCollectionName() string {
	return sl.GetBundleGroup().GetName()
}

// GetCollection function
func (sl *SelectList) GetCollection() CollectionableGroup {
	var slc SelectListCollection
	return &slc
}

// GetConditions function
func (sl *SelectList) GetConditions() ([]adapters.LoadRequestCondition, error) {
	return []adapters.LoadRequestCondition{
		{
			Field: "uesio.name",
			Value: sl.Name,
		},
	}, nil
}

// GetBundleGroup function
func (sl *SelectList) GetBundleGroup() BundleableGroup {
	var slc SelectListCollection
	return &slc
}

// GetKey function
func (sl *SelectList) GetKey() string {
	return sl.Namespace + "." + sl.Name
}

// GetPermChecker function
func (sl *SelectList) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (sl *SelectList) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(sl, fieldName, value)
}

// GetField function
func (sl *SelectList) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(sl, fieldName)
}

// GetNamespace function
func (sl *SelectList) GetNamespace() string {
	return sl.Namespace
}

// SetNamespace function
func (sl *SelectList) SetNamespace(namespace string) {
	sl.Namespace = namespace
}

// SetWorkspace function
func (sl *SelectList) SetWorkspace(workspace string) {
	sl.Workspace = workspace
}

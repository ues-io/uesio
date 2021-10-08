package meta

import (
	"github.com/humandad/yaml"
)

// SelectListOption struct
type SelectListOption struct {
	Label string `uesio:"label"`
	Value string `uesio:"value"`
}

// SelectList struct
type SelectList struct {
	ID          string             `yaml:"-" uesio:"uesio.id"`
	Name        string             `yaml:"name" uesio:"studio.name"`
	Namespace   string             `yaml:"-" uesio:"-"`
	Options     []SelectListOption `yaml:"options" uesio:"studio.options"`
	BlankOption string             `yaml:"blankOption" uesio:"studio.blank_option"`
	Workspace   *Workspace         `yaml:"-" uesio:"studio.workspace"`
	CreatedBy   *User              `yaml:"-" uesio:"uesio.createdby"`
	Owner       *User              `yaml:"-" uesio:"uesio.owner"`
	UpdatedBy   *User              `yaml:"-" uesio:"uesio.updatedby"`
	UpdatedAt   int64              `yaml:"-" uesio:"uesio.updatedat"`
	CreatedAt   int64              `yaml:"-" uesio:"uesio.createdat"`
	itemMeta    *ItemMeta          `yaml:"-" uesio:"-"`
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
func (sl *SelectList) GetConditions() map[string]string {
	return map[string]string{
		"studio.name": sl.Name,
	}
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

// GetPath function
func (sl *SelectList) GetPath() string {
	return sl.GetKey() + ".yaml"
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
	sl.Workspace = &Workspace{
		ID: workspace,
	}
}

// Loop function
func (sl *SelectList) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(sl, iter)
}

// Len function
func (sl *SelectList) Len() int {
	return StandardItemLen(sl)
}

// GetItemMeta function
func (sl *SelectList) GetItemMeta() *ItemMeta {
	return sl.itemMeta
}

// SetItemMeta function
func (sl *SelectList) SetItemMeta(itemMeta *ItemMeta) {
	sl.itemMeta = itemMeta
}

func (sl *SelectList) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, sl.Name)
	if err != nil {
		return err
	}
	return node.Decode(sl)
}

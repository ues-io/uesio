package meta

import (
	"fmt"

	"github.com/humandad/yaml"
)

// SelectListOption struct
type SelectListOption struct {
	Label string `uesio:"uesio/studio.label" json:"label"`
	Value string `uesio:"uesio/studio.value" json:"value"`
}

// SelectList struct
type SelectList struct {
	ID               string             `yaml:"-" uesio:"uesio/core.id"`
	Name             string             `yaml:"name" uesio:"uesio/studio.name"`
	Namespace        string             `yaml:"-" uesio:"-"`
	Options          []SelectListOption `yaml:"options" uesio:"uesio/studio.options"`
	BlankOptionLabel string             `yaml:"blank_option_label,omitempty" uesio:"uesio/studio.blank_option_label"`
	Workspace        *Workspace         `yaml:"-" uesio:"uesio/studio.workspace"`
	CreatedBy        *User              `yaml:"-" uesio:"uesio/core.createdby"`
	Owner            *User              `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy        *User              `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt        int64              `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt        int64              `yaml:"-" uesio:"uesio/core.createdat"`
	itemMeta         *ItemMeta          `yaml:"-" uesio:"-"`
	Public           bool               `yaml:"public" uesio:"uesio/studio.public"`
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

func (sl *SelectList) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s", workspace, sl.Name)
}

// GetBundleGroup function
func (sl *SelectList) GetBundleGroup() BundleableGroup {
	var slc SelectListCollection
	return &slc
}

// GetKey function
func (sl *SelectList) GetKey() string {
	return fmt.Sprintf("%s.%s", sl.Namespace, sl.Name)
}

// GetPath function
func (sl *SelectList) GetPath() string {
	return sl.Name + ".yaml"
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

func (sl *SelectList) IsPublic() bool {
	return sl.Public
}

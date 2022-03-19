package meta

import (
	"errors"
	"fmt"

	"github.com/humandad/yaml"
)

// ConfigValue struct
type ConfigValue struct {
	ID        string     `yaml:"-" uesio:"uesio/core.id"`
	Name      string     `yaml:"name" uesio:"uesio/studio.name"`
	Namespace string     `yaml:"-" uesio:"-"`
	Store     string     `yaml:"store,omitempty" uesio:"uesio/studio.store"`
	ManagedBy string     `yaml:"managedBy" uesio:"uesio/studio.managedby"`
	Workspace *Workspace `yaml:"-" uesio:"uesio/studio.workspace"`
	itemMeta  *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy *User      `yaml:"-" uesio:"uesio/core.createdby"`
	Owner     *User      `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy *User      `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt int64      `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt int64      `yaml:"-" uesio:"uesio/core.createdat"`
}

// NewConfigValue function
func NewConfigValue(key string) (*ConfigValue, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for ConfigValue: " + key)
	}
	return &ConfigValue{
		Name:      name,
		Namespace: namespace,
	}, nil
}

// GetCollectionName function
func (cv *ConfigValue) GetCollectionName() string {
	return cv.GetBundleGroup().GetName()
}

// GetCollection function
func (cv *ConfigValue) GetCollection() CollectionableGroup {
	var cvc ConfigValueCollection
	return &cvc
}

func (cv *ConfigValue) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s", workspace, cv.Name)
}

// GetBundleGroup function
func (cv *ConfigValue) GetBundleGroup() BundleableGroup {
	var cvc ConfigValueCollection
	return &cvc
}

// GetKey function
func (cv *ConfigValue) GetKey() string {
	return fmt.Sprintf("%s.%s", cv.Namespace, cv.Name)
}

// GetPath function
func (cv *ConfigValue) GetPath() string {
	return cv.Name + ".yaml"
}

// GetPermChecker function
func (cv *ConfigValue) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (cv *ConfigValue) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(cv, fieldName, value)
}

// GetField function
func (cv *ConfigValue) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(cv, fieldName)
}

// GetNamespace function
func (cv *ConfigValue) GetNamespace() string {
	return cv.Namespace
}

// SetNamespace function
func (cv *ConfigValue) SetNamespace(namespace string) {
	cv.Namespace = namespace
}

// SetWorkspace function
func (cv *ConfigValue) SetWorkspace(workspace string) {
	cv.Workspace = &Workspace{
		ID: workspace,
	}
}

// Loop function
func (cv *ConfigValue) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(cv, iter)
}

// Len function
func (cv *ConfigValue) Len() int {
	return StandardItemLen(cv)
}

// GetItemMeta function
func (cv *ConfigValue) GetItemMeta() *ItemMeta {
	return cv.itemMeta
}

// SetItemMeta function
func (cv *ConfigValue) SetItemMeta(itemMeta *ItemMeta) {
	cv.itemMeta = itemMeta
}

func (cv *ConfigValue) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, cv.Name)
	if err != nil {
		return err
	}
	return node.Decode(cv)
}

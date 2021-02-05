package meta

import (
	"errors"
)

// ConfigValue struct
type ConfigValue struct {
	ID        string `yaml:"-" uesio:"uesio.id"`
	Name      string `yaml:"name" uesio:"uesio.name"`
	Namespace string `yaml:"-" uesio:"-"`
	Type      string `yaml:"type,omitempty" uesio:"uesio.type"`
	ManagedBy string `yaml:"managedBy" uesio:"uesio.managedby"`
	Workspace string `yaml:"-" uesio:"uesio.workspaceid"`
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

// GetConditions function
func (cv *ConfigValue) GetConditions() map[string]string {
	return map[string]string{
		"uesio.name": cv.Name,
	}
}

// GetBundleGroup function
func (cv *ConfigValue) GetBundleGroup() BundleableGroup {
	var cvc ConfigValueCollection
	return &cvc
}

// GetKey function
func (cv *ConfigValue) GetKey() string {
	return cv.Namespace + "." + cv.Name
}

// GetPath function
func (cv *ConfigValue) GetPath() string {
	return cv.GetKey() + ".yaml"
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
	cv.Workspace = workspace
}

// Loop function
func (cv *ConfigValue) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(cv, iter)
}

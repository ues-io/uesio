package metadata

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

// ConfigValue struct
type ConfigValue struct {
	Name      string `yaml:"name" uesio:"uesio.name"`
	Namespace string `yaml:"-" uesio:"-"`
	Type      string `yaml:"type,omitempty" uesio:"uesio.type"`
	ManagedBy string `yaml:"managedBy" uesio:"uesio.managedby"`
	Workspace string `yaml:"-" uesio:"uesio.workspaceid"`
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
func (cv *ConfigValue) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.name",
			Value: cv.Name,
		},
	}, nil
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

// GetConfigValue key
func GetConfigValue(key string, site *Site) (string, error) {
	if key == "" {
		return "", nil
	}

	namespace, name, err := ParseKey(key)
	if err != nil {
		return "", errors.New("Failed Parsing Config Value: " + key + " : " + err.Error())
	}

	// Only use the environment configstore for now
	store, err := configstore.GetConfigStore("environment")
	if err != nil {
		return "", err
	}

	return store.Get(namespace, name, site.Name)
}

// MergeConfigValue function
func MergeConfigValue(template string, site *Site) (string, error) {
	configTemplate, err := templating.NewWithFunc(template, func(m map[string]interface{}, key string) (interface{}, error) {
		return GetConfigValue(key, site)
	})

	value, err := templating.Execute(configTemplate, nil)
	if err != nil {
		return "", err
	}
	return value, nil
}

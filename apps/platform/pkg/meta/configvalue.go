package meta

import (
	"errors"
	"fmt"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

type ConfigValue struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Store          string `yaml:"store,omitempty" json:"uesio/studio.store"`
	ManagedBy      string `yaml:"managedBy,omitempty" json:"uesio/studio.managedby"`
	DefaultValue   string `yaml:"defaultValue,omitempty" json:"uesio/studio.defaultvalue"`
	Value          string `yaml:"-" json:"-"`
	HasValue       bool   `yaml:"-" json:"-"`
}

type ConfigValueWrapper ConfigValue

func (cv *ConfigValue) GetBytes() ([]byte, error) {
	return gojay.MarshalJSONObject(cv)
}

func (cv *ConfigValue) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddStringKey("namespace", cv.Namespace)
	enc.AddStringKey("name", cv.Name)
	value := cv.Value
	if value == "" && cv.DefaultValue != "" {
		value = cv.DefaultValue
	}
	enc.AddStringKey("value", value)
}

func (cv *ConfigValue) IsNil() bool {
	return cv == nil
}

func NewConfigValue(key string) (*ConfigValue, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for ConfigValue: " + key)
	}
	return NewBaseConfigValue(namespace, name), nil
}

func NewBaseConfigValue(namespace, name string) *ConfigValue {
	return &ConfigValue{BundleableBase: NewBase(namespace, name)}
}

func (cv *ConfigValue) GetCollection() CollectionableGroup {
	return &ConfigValueCollection{}
}

func (cv *ConfigValue) GetCollectionName() string {
	return CONFIGVALUE_COLLECTION_NAME
}

func (cv *ConfigValue) GetBundleFolderName() string {
	return CONFIGVALUE_FOLDER_NAME
}

func (cv *ConfigValue) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, cv.Name)
}

func (cv *ConfigValue) GetKey() string {
	return fmt.Sprintf("%s.%s", cv.Namespace, cv.Name)
}

func (cv *ConfigValue) GetPath() string {
	return cv.Name + ".yaml"
}

func (cv *ConfigValue) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(cv, fieldName, value)
}

func (cv *ConfigValue) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(cv, fieldName)
}

func (cv *ConfigValue) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(cv, iter)
}

func (cv *ConfigValue) Len() int {
	return StandardItemLen(cv)
}

func (cv *ConfigValue) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, cv.Name)
	if err != nil {
		return err
	}
	return node.Decode((*ConfigValueWrapper)(cv))
}

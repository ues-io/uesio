package meta

import (
	"errors"
	"fmt"
	"time"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

type ConfigValue struct {
	ID        string     `yaml:"-" json:"uesio/core.id"`
	UniqueKey string     `yaml:"-" json:"uesio/core.uniquekey"`
	Name      string     `yaml:"name" json:"uesio/studio.name"`
	Namespace string     `yaml:"-" json:"-"`
	Store     string     `yaml:"store,omitempty" json:"uesio/studio.store"`
	ManagedBy string     `yaml:"managedBy,omitempty" json:"uesio/studio.managedby"`
	Workspace *Workspace `yaml:"-" json:"uesio/studio.workspace"`
	itemMeta  *ItemMeta  `yaml:"-" json:"-"`
	CreatedBy *User      `yaml:"-" json:"uesio/core.createdby"`
	Owner     *User      `yaml:"-" json:"uesio/core.owner"`
	UpdatedBy *User      `yaml:"-" json:"uesio/core.updatedby"`
	UpdatedAt int64      `yaml:"-" json:"uesio/core.updatedat"`
	CreatedAt int64      `yaml:"-" json:"uesio/core.createdat"`
	Public    bool       `yaml:"public,omitempty" json:"uesio/studio.public"`
	Value     string
}

type ConfigValueWrapper ConfigValue

func (cv *ConfigValue) GetBytes() ([]byte, error) {
	return gojay.MarshalJSONObject(cv)
}

func (cv *ConfigValue) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddStringKey("namespace", cv.Namespace)
	enc.AddStringKey("name", cv.Name)
	enc.AddStringKey("value", cv.Value)
}

func (cv *ConfigValue) IsNil() bool {
	return cv == nil
}

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

func (cv *ConfigValue) GetCollectionName() string {
	return cv.GetBundleGroup().GetName()
}

func (cv *ConfigValue) GetCollection() CollectionableGroup {
	return &ConfigValueCollection{}
}

func (cv *ConfigValue) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, cv.Name)
}

func (cv *ConfigValue) GetBundleGroup() BundleableGroup {
	return &ConfigValueCollection{}
}

func (cv *ConfigValue) GetKey() string {
	return fmt.Sprintf("%s.%s", cv.Namespace, cv.Name)
}

func (cv *ConfigValue) GetPath() string {
	return cv.Name + ".yaml"
}

func (cv *ConfigValue) GetPermChecker() *PermissionSet {
	return nil
}

func (cv *ConfigValue) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(cv, fieldName, value)
}

func (cv *ConfigValue) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(cv, fieldName)
}

func (cv *ConfigValue) GetNamespace() string {
	return cv.Namespace
}

func (cv *ConfigValue) SetNamespace(namespace string) {
	cv.Namespace = namespace
}

func (cv *ConfigValue) SetModified(mod time.Time) {
	cv.UpdatedAt = mod.UnixMilli()
}

func (cv *ConfigValue) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(cv, iter)
}

func (cv *ConfigValue) Len() int {
	return StandardItemLen(cv)
}

func (cv *ConfigValue) GetItemMeta() *ItemMeta {
	return cv.itemMeta
}

func (cv *ConfigValue) SetItemMeta(itemMeta *ItemMeta) {
	cv.itemMeta = itemMeta
}

func (cv *ConfigValue) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, cv.Name)
	if err != nil {
		return err
	}
	return node.Decode((*ConfigValueWrapper)(cv))
}
func (cv *ConfigValue) IsPublic() bool {
	return cv.Public
}

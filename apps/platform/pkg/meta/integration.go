package meta

import (
	"errors"
	"fmt"
	"time"

	"gopkg.in/yaml.v3"
)

func NewIntegration(key string) (*Integration, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Integration: " + key)
	}
	return &Integration{
		Name:      name,
		Namespace: namespace,
	}, nil
}

type Integration struct {
	ID          string            `yaml:"-" json:"uesio/core.id"`
	UniqueKey   string            `yaml:"-" json:"uesio/core.uniquekey"`
	Name        string            `yaml:"name" json:"uesio/studio.name"`
	Namespace   string            `yaml:"-" json:"-"`
	Type        string            `yaml:"type" json:"uesio/studio.type"`
	Credentials string            `yaml:"credentials" json:"uesio/studio.credentials"`
	Headers     map[string]string `yaml:"headers" json:"uesio/studio.headers"`
	BaseURL     string            `yaml:"baseUrl" json:"uesio/studio.baseurl"`
	Workspace   *Workspace        `yaml:"-" json:"uesio/studio.workspace"`
	itemMeta    *ItemMeta         `yaml:"-" json:"-"`
	CreatedBy   *User             `yaml:"-" json:"uesio/core.createdby"`
	Owner       *User             `yaml:"-" json:"uesio/core.owner"`
	UpdatedBy   *User             `yaml:"-" json:"uesio/core.updatedby"`
	UpdatedAt   int64             `yaml:"-" json:"uesio/core.updatedat"`
	CreatedAt   int64             `yaml:"-" json:"uesio/core.createdat"`
	Public      bool              `yaml:"public,omitempty" json:"uesio/studio.public"`
}

type IntegrationWrapper Integration

func (i *Integration) GetCollectionName() string {
	return i.GetBundleGroup().GetName()
}

func (i *Integration) GetCollection() CollectionableGroup {
	return &IntegrationCollection{}
}

func (i *Integration) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, i.Name)
}

func (i *Integration) GetBundleGroup() BundleableGroup {
	return &IntegrationCollection{}
}

func (i *Integration) GetKey() string {
	return fmt.Sprintf("%s.%s", i.Namespace, i.Name)
}

func (i *Integration) GetPath() string {
	return i.Name + ".yaml"
}

func (i *Integration) GetPermChecker() *PermissionSet {
	return nil
}

func (i *Integration) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(i, fieldName, value)
}

func (i *Integration) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(i, fieldName)
}

func (i *Integration) GetNamespace() string {
	return i.Namespace
}

func (i *Integration) SetNamespace(namespace string) {
	i.Namespace = namespace
}

func (i *Integration) SetModified(mod time.Time) {
	i.UpdatedAt = mod.UnixMilli()
}

func (i *Integration) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(i, iter)
}

func (i *Integration) Len() int {
	return StandardItemLen(i)
}

func (i *Integration) GetItemMeta() *ItemMeta {
	return i.itemMeta
}

func (i *Integration) SetItemMeta(itemMeta *ItemMeta) {
	i.itemMeta = itemMeta
}

func (i *Integration) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, i.Name)
	if err != nil {
		return err
	}
	return node.Decode((*IntegrationWrapper)(i))
}

func (i *Integration) IsPublic() bool {
	return i.Public
}

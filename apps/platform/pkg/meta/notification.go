package meta

import (
	"errors"
	"fmt"
	"time"

	"github.com/humandad/yaml"
)

func NewNotification(key string) (*Notification, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Notification: " + key)
	}
	return &Notification{
		Name:      name,
		Namespace: namespace,
	}, nil
}

type Notification struct {
	ID          string     `yaml:"-" uesio:"uesio/core.id"`
	UniqueKey   string     `yaml:"-" uesio:"uesio/core.uniquekey"`
	Name        string     `yaml:"name" uesio:"uesio/studio.name"`
	Namespace   string     `yaml:"-" uesio:"-"`
	Type        string     `yaml:"type" uesio:"uesio/studio.type"`
	Credentials string     `yaml:"credentials" uesio:"uesio/studio.credentials"`
	Workspace   *Workspace `yaml:"-" uesio:"uesio/studio.workspace"`
	itemMeta    *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy   *User      `yaml:"-" uesio:"uesio/core.createdby"`
	Owner       *User      `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy   *User      `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt   int64      `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt   int64      `yaml:"-" uesio:"uesio/core.createdat"`
	Public      bool       `yaml:"public,omitempty" uesio:"uesio/studio.public"`
}

func (n *Notification) GetCollectionName() string {
	return n.GetBundleGroup().GetName()
}

func (n *Notification) GetCollection() CollectionableGroup {
	var nc NotificationCollection
	return &nc
}

func (n *Notification) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, n.Name)
}

func (n *Notification) GetBundleGroup() BundleableGroup {
	var nsrc DataSourceCollection
	return &nsrc
}

func (n *Notification) GetKey() string {
	return fmt.Sprintf("%s.%s", n.Namespace, n.Name)
}

func (n *Notification) GetPath() string {
	return n.Name + ".yaml"
}

func (n *Notification) GetPermChecker() *PermissionSet {
	return nil
}

func (n *Notification) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(n, fieldName, value)
}

func (n *Notification) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(n, fieldName)
}

func (n *Notification) GetNamespace() string {
	return n.Namespace
}

func (n *Notification) SetNamespace(namespace string) {
	n.Namespace = namespace
}

func (n *Notification) SetModified(mod time.Time) {
	n.UpdatedAt = mod.UnixMilli()
}

func (n *Notification) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(n, iter)
}

func (n *Notification) Len() int {
	return StandardItemLen(n)
}

func (n *Notification) GetItemMeta() *ItemMeta {
	return n.itemMeta
}

func (n *Notification) SetItemMeta(itemMeta *ItemMeta) {
	n.itemMeta = itemMeta
}

func (n *Notification) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, n.Name)
	if err != nil {
		return err
	}
	return node.Decode(n)
}

func (n *Notification) IsPublic() bool {
	return n.Public
}

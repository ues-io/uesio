package meta

import (
	"errors"

	"gopkg.in/yaml.v3"
)

func NewNotificationSource(key string) (*NotificationSource, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Datasource: " + key)
	}
	return &NotificationSource{
		BundleableBase: NewBase(namespace, name),
	}, nil
}

func NewBaseNotificationSource(namespace, name string) *NotificationSource {
	return &NotificationSource{BundleableBase: NewBase(namespace, name)}
}

type NotificationSource struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Type           string `yaml:"type" json:"uesio/studio.type"`
	Credentials    string `yaml:"credentials" json:"uesio/studio.credentials"`
}

type NotificationSourceWrapper NotificationSource

func (ns *NotificationSource) GetCollectionName() string {
	return NOTIFICATIONSOURCE_COLLECTION_NAME
}

func (ns *NotificationSource) GetBundleFolderName() string {
	return NOTIFICATIONSOURCE_FOLDER_NAME
}

func (ns *NotificationSource) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(ns, fieldName, value)
}

func (ns *NotificationSource) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(ns, fieldName)
}

func (ns *NotificationSource) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(ns, iter)
}

func (ns *NotificationSource) Len() int {
	return StandardItemLen(ns)
}

func (ns *NotificationSource) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, ns.Name)
	if err != nil {
		return err
	}
	return node.Decode((*DataSourceWrapper)(ns))
}

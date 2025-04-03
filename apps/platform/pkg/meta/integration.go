package meta

import (
	"fmt"

	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func NewIntegration(key string) (*Integration, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, exceptions.NewBadRequestException(fmt.Errorf("Bad Key for Integration: %s", key))
	}
	return NewBaseIntegration(namespace, name), nil
}

func NewBaseIntegration(namespace, name string) *Integration {
	return &Integration{BundleableBase: NewBase(namespace, name)}
}

type Integration struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Type           string `yaml:"type" json:"uesio/studio.type"`
	Authentication string `yaml:"authentication,omitempty" json:"uesio/studio.authentication"`
	Credentials    string `yaml:"credentials,omitempty" json:"uesio/studio.credentials"`
	BaseURL        string `yaml:"baseUrl,omitempty" json:"uesio/studio.baseurl"`
}

type IntegrationWrapper Integration

func (i *Integration) GetType() string {
	return i.Type
}

func (i *Integration) GetCollection() CollectionableGroup {
	return &IntegrationCollection{}
}

func (i *Integration) GetCollectionName() string {
	return INTEGRATION_COLLECTION_NAME
}

func (i *Integration) GetBundleFolderName() string {
	return INTEGRATION_FOLDER_NAME
}

func (i *Integration) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(i, fieldName, value)
}

func (i *Integration) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(i, fieldName)
}

func (i *Integration) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(i, iter)
}

func (i *Integration) Len() int {
	return StandardItemLen(i)
}

func (i *Integration) UnmarshalYAML(node *yaml.Node) error {
	if err := validateNodeName(node, i.Name); err != nil {
		return err
	}
	i.Type = pickMetadataItem(node, "type", i.Namespace, "")
	i.Credentials = pickMetadataItem(node, "credentials", i.Namespace, "")
	return node.Decode((*IntegrationWrapper)(i))
}

func (i *Integration) MarshalYAML() (interface{}, error) {
	i.Type = removeDefault(GetLocalizedKey(i.Type, i.Namespace), "")
	i.Credentials = removeDefault(GetLocalizedKey(i.Credentials, i.Namespace), "")
	return (*IntegrationWrapper)(i), nil
}

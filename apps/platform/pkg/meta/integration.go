package meta

import (
	"errors"

	"gopkg.in/yaml.v3"
)

func NewIntegration(key string) (*Integration, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Integration: " + key)
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
	LoadBot        string `yaml:"loadBot,omitempty" json:"uesio/studio.loadbot"`
	SaveBot        string `yaml:"saveBot,omitempty" json:"uesio/studio.savebot"`
	RunActionBot   string `yaml:"runActionBot,omitempty" json:"uesio/studio.runactionbot"`
	// TODO Remove headers
	Headers map[string]string `yaml:"headers,omitempty" json:"uesio/studio.headers"`
}

type IntegrationWrapper Integration

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
	i.Credentials = pickMetadataItem(node, "credentials", i.Namespace, "")
	i.LoadBot = pickMetadataItem(node, "loadBot", i.Namespace, "")
	i.SaveBot = pickMetadataItem(node, "saveBot", i.Namespace, "")
	i.RunActionBot = pickMetadataItem(node, "runActionBot", i.Namespace, "")
	return node.Decode((*IntegrationWrapper)(i))
}

func (i *Integration) MarshalYAML() (interface{}, error) {
	i.Credentials = removeDefault(GetLocalizedKey(i.Credentials, i.Namespace), "")
	i.LoadBot = removeDefault(GetLocalizedKey(i.LoadBot, i.Namespace), "")
	i.SaveBot = removeDefault(GetLocalizedKey(i.SaveBot, i.Namespace), "")
	i.RunActionBot = removeDefault(GetLocalizedKey(i.RunActionBot, i.Namespace), "")
	return (*IntegrationWrapper)(i), nil
}

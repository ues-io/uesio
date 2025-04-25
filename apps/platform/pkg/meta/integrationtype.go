package meta

import (
	"errors"

	"gopkg.in/yaml.v3"
)

func NewIntegrationType(key string) (*IntegrationType, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Integration Type: " + key)
	}
	return NewBaseIntegrationType(namespace, name), nil
}

func NewBaseIntegrationType(namespace, name string) *IntegrationType {
	return &IntegrationType{BundleableBase: NewBase(namespace, name)}
}

type IntegrationType struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	LoadBot        string `yaml:"loadBot,omitempty" json:"uesio/studio.loadbot"`
	SaveBot        string `yaml:"saveBot,omitempty" json:"uesio/studio.savebot"`
	RunActionBot   string `yaml:"runActionBot,omitempty" json:"uesio/studio.runactionbot"`
}

type IntegrationTypeWrapper IntegrationType

func (i *IntegrationType) GetCollection() CollectionableGroup {
	return &IntegrationTypeCollection{}
}

func (i *IntegrationType) GetCollectionName() string {
	return INTEGRATION_TYPE_COLLECTION_NAME
}

func (i *IntegrationType) GetBundleFolderName() string {
	return INTEGRATION_TYPE_FOLDER_NAME
}

func (i *IntegrationType) SetField(fieldName string, value any) error {
	return StandardFieldSet(i, fieldName, value)
}

func (i *IntegrationType) GetField(fieldName string) (any, error) {
	return StandardFieldGet(i, fieldName)
}

func (i *IntegrationType) Loop(iter func(string, any) error) error {
	return StandardItemLoop(i, iter)
}

func (i *IntegrationType) Len() int {
	return StandardItemLen(i)
}

func (i *IntegrationType) UnmarshalYAML(node *yaml.Node) error {
	if err := validateNodeName(node, i.Name); err != nil {
		return err
	}
	i.LoadBot = pickMetadataItem(node, "loadBot", i.Namespace, "")
	i.SaveBot = pickMetadataItem(node, "saveBot", i.Namespace, "")
	i.RunActionBot = pickMetadataItem(node, "runActionBot", i.Namespace, "")
	return node.Decode((*IntegrationTypeWrapper)(i))
}

func (i *IntegrationType) MarshalYAML() (any, error) {
	i.LoadBot = removeDefault(GetLocalizedKey(i.LoadBot, i.Namespace), "")
	i.SaveBot = removeDefault(GetLocalizedKey(i.SaveBot, i.Namespace), "")
	i.RunActionBot = removeDefault(GetLocalizedKey(i.RunActionBot, i.Namespace), "")
	return (*IntegrationTypeWrapper)(i), nil
}

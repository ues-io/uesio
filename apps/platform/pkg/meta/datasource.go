package meta

import (
	"errors"

	"gopkg.in/yaml.v3"
)

const PLATFORM_DATA_SOURCE = "uesio/core.platform"

func NewDataSource(key string) (*DataSource, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Datasource: " + key)
	}
	return &DataSource{
		BundleableBase: NewBase(namespace, name),
	}, nil
}

func NewBaseDataSource(namespace, name string) *DataSource {
	return &DataSource{BundleableBase: NewBase(namespace, name)}
}

type DataSource struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Type           string `yaml:"type" json:"uesio/studio.type"`
	Credentials    string `yaml:"credentials" json:"uesio/studio.credentials"`
	CustomMetadata string `yaml:"customMetadata" json:"uesio/studio.custommetadata"`
	LoadBot        string `yaml:"loadBot" json:"uesio/studio.loadbot"`
	SaveBot        string `yaml:"saveBot" json:"uesio/studio.savebot"`
}

type DataSourceWrapper DataSource

func (ds *DataSource) GetCollectionName() string {
	return DATASOURCE_COLLECTION_NAME
}

func (ds *DataSource) GetBundleFolderName() string {
	return DATASOURCE_FOLDER_NAME
}

func (ds *DataSource) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(ds, fieldName, value)
}

func (ds *DataSource) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(ds, fieldName)
}

func (ds *DataSource) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(ds, iter)
}

func (ds *DataSource) Len() int {
	return StandardItemLen(ds)
}

func (ds *DataSource) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, ds.Name)
	if err != nil {
		return err
	}
	return node.Decode((*DataSourceWrapper)(ds))
}

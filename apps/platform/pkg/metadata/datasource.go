package metadata

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/creds"
)

// NewDataSource function
func NewDataSource(key string) (*DataSource, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Datasource: " + key)
	}
	return &DataSource{
		Name:      name,
		Namespace: namespace,
	}, nil
}

// DataSource struct
type DataSource struct {
	ID        string `yaml:"-" uesio:"uesio.id"`
	Name      string `yaml:"name" uesio:"uesio.name"`
	Namespace string `yaml:"-" uesio:"-"`
	TypeRef   string `yaml:"type" uesio:"uesio.type"`
	URL       string `yaml:"url,omitempty" uesio:"uesio.url"`
	Region    string `yaml:"region,omitempty" uesio:"uesio.region"`
	Database  string `yaml:"database,omitempty" uesio:"uesio.database"`
	Username  string `yaml:"username,omitempty" uesio:"uesio.username"`
	Password  string `yaml:"password,omitempty" uesio:"uesio.password"`
	Workspace string `yaml:"-" uesio:"uesio.workspaceid"`
}

// GetAdapterType function
func (ds *DataSource) GetAdapterType() string {
	return ds.TypeRef
}

// GetCollectionName function
func (ds *DataSource) GetCollectionName() string {
	return ds.GetBundleGroup().GetName()
}

// GetCollection function
func (ds *DataSource) GetCollection() CollectionableGroup {
	var dsc DataSourceCollection
	return &dsc
}

// GetConditions function
func (ds *DataSource) GetConditions() ([]adapters.LoadRequestCondition, error) {
	return []adapters.LoadRequestCondition{
		{
			Field: "uesio.name",
			Value: ds.Name,
		},
	}, nil
}

// GetBundleGroup function
func (ds *DataSource) GetBundleGroup() BundleableGroup {
	var dsc DataSourceCollection
	return &dsc
}

// GetCredentials function
func (ds *DataSource) GetCredentials(site *Site) (*creds.AdapterCredentials, error) {
	database, err := MergeConfigValue(ds.Database, site)
	if err != nil {
		return nil, err
	}
	username, err := GetSecret(ds.Username, site)
	if err != nil {
		return nil, err
	}
	url, err := MergeConfigValue(ds.URL, site)
	if err != nil {
		return nil, err
	}
	region, err := MergeConfigValue(ds.Region, site)
	if err != nil {
		return nil, err
	}
	password, err := GetSecret(ds.Password, site)
	if err != nil {
		return nil, err
	}

	return &creds.AdapterCredentials{
		Database: database,
		Username: username,
		Password: password,
		URL:      url,
		Region:   region,
	}, nil
}

// GetKey function
func (ds *DataSource) GetKey() string {
	return ds.Namespace + "." + ds.Name
}

// GetPath function
func (ds *DataSource) GetPath() string {
	return ds.GetKey() + ".yaml"
}

// GetPermChecker function
func (ds *DataSource) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (ds *DataSource) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(ds, fieldName, value)
}

// GetField function
func (ds *DataSource) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(ds, fieldName)
}

// GetNamespace function
func (ds *DataSource) GetNamespace() string {
	return ds.Namespace
}

// SetNamespace function
func (ds *DataSource) SetNamespace(namespace string) {
	ds.Namespace = namespace
}

// SetWorkspace function
func (ds *DataSource) SetWorkspace(workspace string) {
	ds.Workspace = workspace
}

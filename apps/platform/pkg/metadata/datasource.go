package metadata

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// NewDataSource function
func NewDataSource(key string) (*DataSource, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Datasource")
	}
	return &DataSource{
		Name:      name,
		Namespace: namespace,
	}, nil
}

// DataSource struct
type DataSource struct {
	Name      string `yaml:"name" uesio:"uesio.name"`
	Namespace string `yaml:"namespace" uesio:"-"`
	TypeRef   string `yaml:"type" uesio:"uesio.type"`
	URL       string `yaml:"url" uesio:"uesio.url"`
	Region    string `yaml:"region" uesio:"uesio.region"`
	Database  string `yaml:"database" uesio:"uesio.database"`
	Username  string `yaml:"username" uesio:"uesio.username"`
	Password  string `yaml:"password" uesio:"uesio.password"`
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
func (ds *DataSource) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
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

// GetPermChecker function
func (ds *DataSource) GetPermChecker() *PermissionSet {
	return nil
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

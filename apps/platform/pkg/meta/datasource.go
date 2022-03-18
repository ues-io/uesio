package meta

import (
	"errors"
	"fmt"

	"github.com/humandad/yaml"
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
	ID          string     `yaml:"-" uesio:"uesio/uesio.id"`
	Name        string     `yaml:"name" uesio:"uesio/studio.name"`
	Namespace   string     `yaml:"-" uesio:"-"`
	Type        string     `yaml:"type" uesio:"uesio/studio.type"`
	Credentials string     `yaml:"credentials" uesio:"uesio/studio.credentials"`
	Workspace   *Workspace `yaml:"-" uesio:"uesio/studio.workspace"`
	itemMeta    *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy   *User      `yaml:"-" uesio:"uesio/uesio.createdby"`
	Owner       *User      `yaml:"-" uesio:"uesio/uesio.owner"`
	UpdatedBy   *User      `yaml:"-" uesio:"uesio/uesio.updatedby"`
	UpdatedAt   int64      `yaml:"-" uesio:"uesio/uesio.updatedat"`
	CreatedAt   int64      `yaml:"-" uesio:"uesio/uesio.createdat"`
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

func (ds *DataSource) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s", workspace, ds.Name)
}

// GetBundleGroup function
func (ds *DataSource) GetBundleGroup() BundleableGroup {
	var dsc DataSourceCollection
	return &dsc
}

// GetKey function
func (ds *DataSource) GetKey() string {
	return ds.Namespace + "." + ds.Name
}

// GetPath function
func (ds *DataSource) GetPath() string {
	return ds.Name + ".yaml"
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
	ds.Workspace = &Workspace{
		ID: workspace,
	}
}

// Loop function
func (ds *DataSource) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(ds, iter)
}

// Len function
func (ds *DataSource) Len() int {
	return StandardItemLen(ds)
}

// GetItemMeta function
func (ds *DataSource) GetItemMeta() *ItemMeta {
	return ds.itemMeta
}

// SetItemMeta function
func (ds *DataSource) SetItemMeta(itemMeta *ItemMeta) {
	ds.itemMeta = itemMeta
}

func (ds *DataSource) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, ds.Name)
	if err != nil {
		return err
	}
	return node.Decode(ds)
}

package meta

import (
	"errors"
	"fmt"
	"time"

	"gopkg.in/yaml.v3"
)

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

type DataSource struct {
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

type DataSourceWrapper DataSource

func (ds *DataSource) GetCollectionName() string {
	return ds.GetBundleGroup().GetName()
}

func (ds *DataSource) GetCollection() CollectionableGroup {
	var dsc DataSourceCollection
	return &dsc
}

func (ds *DataSource) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, ds.Name)
}

func (ds *DataSource) GetBundleGroup() BundleableGroup {
	var dsc DataSourceCollection
	return &dsc
}

func (ds *DataSource) GetKey() string {
	return fmt.Sprintf("%s.%s", ds.Namespace, ds.Name)
}

func (ds *DataSource) GetPath() string {
	return ds.Name + ".yaml"
}

func (ds *DataSource) GetPermChecker() *PermissionSet {
	return nil
}

func (ds *DataSource) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(ds, fieldName, value)
}

func (ds *DataSource) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(ds, fieldName)
}

func (ds *DataSource) GetNamespace() string {
	return ds.Namespace
}

func (ds *DataSource) SetNamespace(namespace string) {
	ds.Namespace = namespace
}

func (ds *DataSource) SetModified(mod time.Time) {
	ds.UpdatedAt = mod.UnixMilli()
}

func (ds *DataSource) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(ds, iter)
}

func (ds *DataSource) Len() int {
	return StandardItemLen(ds)
}

func (ds *DataSource) GetItemMeta() *ItemMeta {
	return ds.itemMeta
}

func (ds *DataSource) SetItemMeta(itemMeta *ItemMeta) {
	ds.itemMeta = itemMeta
}

func (ds *DataSource) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, ds.Name)
	if err != nil {
		return err
	}
	return node.Decode((*DataSourceWrapper)(ds))
}

func (ds *DataSource) IsPublic() bool {
	return ds.Public
}

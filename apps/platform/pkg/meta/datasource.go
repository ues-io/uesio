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
	ID          string     `yaml:"-" json:"uesio/core.id"`
	UniqueKey   string     `yaml:"-" json:"uesio/core.uniquekey"`
	Name        string     `yaml:"name" json:"uesio/studio.name"`
	Namespace   string     `yaml:"-" json:"-"`
	Type        string     `yaml:"type" json:"uesio/studio.type"`
	Credentials string     `yaml:"credentials" json:"uesio/studio.credentials"`
	Workspace   *Workspace `yaml:"-" json:"uesio/studio.workspace"`
	itemMeta    *ItemMeta  `yaml:"-" json:"-"`
	CreatedBy   *User      `yaml:"-" json:"uesio/core.createdby"`
	Owner       *User      `yaml:"-" json:"uesio/core.owner"`
	UpdatedBy   *User      `yaml:"-" json:"uesio/core.updatedby"`
	UpdatedAt   int64      `yaml:"-" json:"uesio/core.updatedat"`
	CreatedAt   int64      `yaml:"-" json:"uesio/core.createdat"`
	Public      bool       `yaml:"public,omitempty" json:"uesio/studio.public"`
}

type DataSourceWrapper DataSource

func (ds *DataSource) GetCollectionName() string {
	return ds.GetBundleGroup().GetName()
}

func (ds *DataSource) GetCollection() CollectionableGroup {
	return &DataSourceCollection{}
}

func (ds *DataSource) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, ds.Name)
}

func (ds *DataSource) GetBundleGroup() BundleableGroup {
	return &DataSourceCollection{}
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

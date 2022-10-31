package meta

import (
	"errors"
	"fmt"
	"time"

	"gopkg.in/yaml.v3"
)

func NewFileSource(key string) (*FileSource, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for FileSource")
	}
	return &FileSource{
		Name:      name,
		Namespace: namespace,
	}, nil
}

type FileSource struct {
	ID          string     `yaml:"-" json:"uesio/core.id"`
	UniqueKey   string     `yaml:"-" json:"uesio/core.uniquekey"`
	Name        string     `yaml:"-" json:"uesio/studio.name"`
	Namespace   string     `yaml:"-" json:"-"`
	Type        string     `yaml:"type,omitempty" json:"-"`
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

type FileSourceWrapper FileSource

func (fs *FileSource) GetCollectionName() string {
	return fs.GetBundleGroup().GetName()
}

func (fs *FileSource) GetCollection() CollectionableGroup {
	var fsc FileSourceCollection
	return &fsc
}

func (fs *FileSource) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, fs.Name)
}

func (fs *FileSource) GetBundleGroup() BundleableGroup {
	var fsc FileSourceCollection
	return &fsc
}

func (fs *FileSource) GetKey() string {
	return fmt.Sprintf("%s.%s", fs.Namespace, fs.Name)
}

func (fs *FileSource) GetPath() string {
	return fs.Name + ".yaml"
}

func (fs *FileSource) GetPermChecker() *PermissionSet {
	return nil
}

func (fs *FileSource) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(fs, fieldName, value)
}

func (fs *FileSource) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(fs, fieldName)
}

func (fs *FileSource) GetNamespace() string {
	return fs.Namespace
}

func (fs *FileSource) SetNamespace(namespace string) {
	fs.Namespace = namespace
}

func (fs *FileSource) SetModified(mod time.Time) {
	fs.UpdatedAt = mod.UnixMilli()
}

func (fs *FileSource) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(fs, iter)
}

func (fs *FileSource) Len() int {
	return StandardItemLen(fs)
}

func (fs *FileSource) GetItemMeta() *ItemMeta {
	return fs.itemMeta
}

func (fs *FileSource) SetItemMeta(itemMeta *ItemMeta) {
	fs.itemMeta = itemMeta
}

func (fs *FileSource) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, fs.Name)
	if err != nil {
		return err
	}
	return node.Decode((*FileSourceWrapper)(fs))
}

func (fs *FileSource) IsPublic() bool {
	return fs.Public
}

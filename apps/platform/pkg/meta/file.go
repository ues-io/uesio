package meta

import (
	"errors"
	"fmt"
	"path/filepath"
	"time"

	"gopkg.in/yaml.v3"
)

func NewFile(key string) (*File, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for File: " + key)
	}
	return &File{
		Name:      name,
		Namespace: namespace,
	}, nil
}

type File struct {
	ID        string            `yaml:"-" uesio:"uesio/core.id"`
	UniqueKey string            `yaml:"-" uesio:"uesio/core.uniquekey"`
	Name      string            `yaml:"name" uesio:"uesio/studio.name"`
	Namespace string            `yaml:"-" uesio:"-"`
	FileName  string            `yaml:"fileName" uesio:"-"`
	Workspace *Workspace        `yaml:"-" uesio:"uesio/studio.workspace"`
	Content   *UserFileMetadata `yaml:"-" uesio:"uesio/studio.content"`
	itemMeta  *ItemMeta         `yaml:"-" uesio:"-"`
	CreatedBy *User             `yaml:"-" uesio:"uesio/core.createdby"`
	Owner     *User             `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy *User             `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt int64             `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt int64             `yaml:"-" uesio:"uesio/core.createdat"`
	Public    bool              `yaml:"public,omitempty" uesio:"uesio/studio.public"`
}

type FileWrapper File

func (f *File) GetCollectionName() string {
	return f.GetBundleGroup().GetName()
}

func (f *File) GetCollection() CollectionableGroup {
	var fc FileCollection
	return &fc
}

func (f *File) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, f.Name)
}

func (f *File) GetBundleGroup() BundleableGroup {
	var fc FileCollection
	return &fc
}

func (f *File) GetKey() string {
	return fmt.Sprintf("%s.%s", f.Namespace, f.Name)
}

func (f *File) GetPath() string {
	return filepath.Join(f.Name, "file.yaml")
}

func (f *File) GetFilePath() string {
	return filepath.Join(f.Name, "file", f.FileName)
}

func (f *File) GetPermChecker() *PermissionSet {
	key := f.GetKey()
	return &PermissionSet{
		FileRefs: map[string]bool{
			key: true,
		},
	}
}

func (f *File) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(f, fieldName, value)
}

func (f *File) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(f, fieldName)
}

func (f *File) GetNamespace() string {
	return f.Namespace
}

func (f *File) SetNamespace(namespace string) {
	f.Namespace = namespace
}

func (f *File) SetModified(mod time.Time) {
	f.UpdatedAt = mod.UnixMilli()
}

func (f *File) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(f, iter)
}

func (f *File) Len() int {
	return StandardItemLen(f)
}

func (f *File) GetItemMeta() *ItemMeta {
	return f.itemMeta
}

func (f *File) SetItemMeta(itemMeta *ItemMeta) {
	f.itemMeta = itemMeta
}

func (f *File) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, f.Name)
	if err != nil {
		return err
	}
	return node.Decode((*FileWrapper)(f))
}

func (f *File) IsPublic() bool {
	return f.Public
}

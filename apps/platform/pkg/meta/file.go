package meta

import (
	"errors"
	"fmt"
	"path/filepath"

	"github.com/humandad/yaml"
)

// NewFile function
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

// File struct
type File struct {
	ID        string            `yaml:"-" uesio:"uesio/core.id"`
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
	Public    bool              `yaml:"public" uesio:"uesio/studio.public"`
}

// GetCollectionName function
func (f *File) GetCollectionName() string {
	return f.GetBundleGroup().GetName()
}

// GetCollection function
func (f *File) GetCollection() CollectionableGroup {
	var fc FileCollection
	return &fc
}

func (f *File) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s", workspace, f.Name)
}

// GetBundleGroup function
func (f *File) GetBundleGroup() BundleableGroup {
	var fc FileCollection
	return &fc
}

// GetKey function
func (f *File) GetKey() string {
	return fmt.Sprintf("%s.%s", f.Namespace, f.Name)
}

// GetPath function
func (f *File) GetPath() string {
	return filepath.Join(f.Name, "file.yaml")
}

// GetFilePath function
func (f *File) GetFilePath() string {
	return filepath.Join(f.Name, "file", f.FileName)
}

// GetPermChecker function
func (f *File) GetPermChecker() *PermissionSet {
	key := f.GetKey()
	return &PermissionSet{
		FileRefs: map[string]bool{
			key: true,
		},
	}
}

// SetField function
func (f *File) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(f, fieldName, value)
}

// GetField function
func (f *File) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(f, fieldName)
}

// GetNamespace function
func (f *File) GetNamespace() string {
	return f.Namespace
}

// SetNamespace function
func (f *File) SetNamespace(namespace string) {
	f.Namespace = namespace
}

// SetWorkspace function
func (f *File) SetWorkspace(workspace string) {
	f.Workspace = &Workspace{
		ID: workspace,
	}
}

// Loop function
func (f *File) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(f, iter)
}

// Len function
func (f *File) Len() int {
	return StandardItemLen(f)
}

// GetItemMeta function
func (f *File) GetItemMeta() *ItemMeta {
	return f.itemMeta
}

// SetItemMeta function
func (f *File) SetItemMeta(itemMeta *ItemMeta) {
	f.itemMeta = itemMeta
}

func (f *File) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, f.Name)
	if err != nil {
		return err
	}
	return node.Decode(f)
}

func (f *File) IsPublic() bool {
	return f.Public
}

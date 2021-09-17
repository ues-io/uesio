package meta

import (
	"errors"
	"path/filepath"
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
	ID        string            `yaml:"-" uesio:"studio.id"`
	Name      string            `yaml:"name" uesio:"studio.name"`
	Namespace string            `yaml:"-" uesio:"-"`
	FileName  string            `yaml:"fileName" uesio:"-"`
	Workspace string            `yaml:"-" uesio:"studio.workspaceid"`
	Content   *UserFileMetadata `yaml:"-" uesio:"studio.content"`
	itemMeta  *ItemMeta         `yaml:"-" uesio:"-"`
	CreatedBy *User             `yaml:"-" uesio:"studio.createdby"`
	UpdatedBy *User             `yaml:"-" uesio:"studio.updatedby"`
	UpdatedAt int64             `yaml:"-" uesio:"studio.updatedat"`
	CreatedAt int64             `yaml:"-" uesio:"studio.createdat"`
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

// GetConditions function
func (f *File) GetConditions() map[string]string {
	return map[string]string{
		"studio.name": f.Name,
	}
}

// GetBundleGroup function
func (f *File) GetBundleGroup() BundleableGroup {
	var fc FileCollection
	return &fc
}

// GetKey function
func (f *File) GetKey() string {
	return f.Namespace + "." + f.Name
}

// GetPath function
func (f *File) GetPath() string {
	return filepath.Join(f.GetKey(), "file.yaml")
}

// GetFilePath function
func (f *File) GetFilePath() string {
	return filepath.Join(f.GetKey(), "file", f.FileName)
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
	f.Workspace = workspace
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

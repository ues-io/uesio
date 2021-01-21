package metadata

import (
	"errors"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/reflecttools"
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
	ID        string            `yaml:"-" uesio:"uesio.id"`
	Name      string            `yaml:"name" uesio:"uesio.name"`
	Namespace string            `yaml:"-" uesio:"-"`
	Content   string            `yaml:"-" uesio:"uesio.content"`
	FileName  string            `yaml:"fileName" uesio:"-"`
	Workspace string            `yaml:"-" uesio:"uesio.workspaceid"`
	Meta      *UserFileMetadata `yaml:"-" uesio:"-"`
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
		"uesio.name": f.Name,
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
	if fieldName == "uesio.content__FILEDATA" {
		fileInfo := UserFileMetadata{}
		err := reflecttools.Set(&fileInfo, value)
		if err != nil {
			return err
		}
		f.Meta = &fileInfo
		return nil
	}
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

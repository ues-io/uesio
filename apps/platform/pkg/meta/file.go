package meta

import (
	"errors"
	"fmt"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

func NewFile(key string) (*File, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for File: " + key)
	}
	return NewBaseFile(namespace, name), nil
}

func NewBaseFile(namespace, name string) *File {
	return &File{BundleableBase: NewBase(namespace, name)}
}

type File struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Path           string `yaml:"path" json:"uesio/studio.path"`
}

type FileWrapper File

func (f *File) GetCollectionName() string {
	return FILE_COLLECTION_NAME
}

func (f *File) GetBundleFolderName() string {
	return FILE_FOLDER_NAME
}

func (f *File) GetBasePath() string {
	return f.Name
}

func (f *File) GetPath() string {
	return filepath.Join(f.Name, "file.yaml")
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

func (f *File) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(f, iter)
}

func (f *File) Len() int {
	return StandardItemLen(f)
}

func (f *File) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, f.Name)
	if err != nil {
		return err
	}
	// Backwards compatibility
	oldFileNameProperty := GetNodeValueAsString(node, "fileName")
	if oldFileNameProperty != "" {
		f.Path = fmt.Sprintf("file/%s", oldFileNameProperty)
	}
	return node.Decode((*FileWrapper)(f))
}

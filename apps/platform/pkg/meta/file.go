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
	return &File{
		Name: name,
		BundleableBase: BundleableBase{
			Namespace: namespace,
		},
	}, nil
}

type File struct {
	Name string `yaml:"name" json:"uesio/studio.name"`
	Path string `yaml:"path" json:"uesio/studio.path"`
	BuiltIn
	BundleableBase `yaml:",inline"`
}

type FileWrapper File

func (f *File) GetCollectionName() string {
	return f.GetBundleGroup().GetName()
}

func (f *File) GetCollection() CollectionableGroup {
	return &FileCollection{}
}

func (f *File) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, f.Name)
}

func (f *File) GetBundleGroup() BundleableGroup {
	return &FileCollection{}
}

func (f *File) GetKey() string {
	return fmt.Sprintf("%s.%s", f.Namespace, f.Name)
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
	return node.Decode((*FileWrapper)(f))
}

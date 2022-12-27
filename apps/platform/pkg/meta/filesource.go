package meta

import (
	"errors"
	"fmt"

	"gopkg.in/yaml.v3"
)

func NewFileSource(key string) (*FileSource, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for FileSource")
	}
	return &FileSource{
		Name: name,
		BundleableBase: BundleableBase{
			Namespace: namespace,
		},
	}, nil
}

type FileSource struct {
	Name        string `yaml:"-" json:"uesio/studio.name"`
	Type        string `yaml:"type,omitempty" json:"-"`
	Credentials string `yaml:"credentials" json:"uesio/studio.credentials"`
	BuiltIn
	BundleableBase `yaml:",inline"`
}

type FileSourceWrapper FileSource

func (fs *FileSource) GetCollectionName() string {
	return FILESOURCE_COLLECTION_NAME
}

func (fs *FileSource) GetBundleFolderName() string {
	return FILESOURCE_FOLDER_NAME
}

func (fs *FileSource) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, fs.Name)
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

func (fs *FileSource) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(fs, iter)
}

func (fs *FileSource) Len() int {
	return StandardItemLen(fs)
}

func (fs *FileSource) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, fs.Name)
	if err != nil {
		return err
	}
	return node.Decode((*FileSourceWrapper)(fs))
}

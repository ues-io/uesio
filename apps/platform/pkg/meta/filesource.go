package meta

import (
	"errors"

	"gopkg.in/yaml.v3"
)

func NewFileSource(key string) (*FileSource, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for FileSource: " + key)
	}
	return NewBaseFileSource(namespace, name), nil
}

func NewBaseFileSource(namespace, name string) *FileSource {
	return &FileSource{BundleableBase: NewBase(namespace, name)}
}

type FileSource struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Type           string `yaml:"type,omitempty" json:"-"`
	Credentials    string `yaml:"credentials" json:"uesio/studio.credentials"`
	Bucket         string `yaml:"bucket" json:"uesio/studio.bucket"`
}

type FileSourceWrapper FileSource

func (fs *FileSource) GetCollection() CollectionableGroup {
	return &FileSourceCollection{}
}

func (fs *FileSource) GetCollectionName() string {
	return FILESOURCE_COLLECTION_NAME
}

func (fs *FileSource) GetBundleFolderName() string {
	return FILESOURCE_FOLDER_NAME
}

func (fs *FileSource) SetField(fieldName string, value any) error {
	return StandardFieldSet(fs, fieldName, value)
}

func (fs *FileSource) GetField(fieldName string) (any, error) {
	return StandardFieldGet(fs, fieldName)
}

func (fs *FileSource) Loop(iter func(string, any) error) error {
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

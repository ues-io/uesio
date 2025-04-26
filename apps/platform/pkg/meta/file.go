package meta

import (
	"fmt"
	"path"

	"github.com/francoispqt/gojay"

	"gopkg.in/yaml.v3"
)

func NewFile(key string) (*File, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, fmt.Errorf("bad key for file: %s", key)
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

func (f *File) GetBytes() ([]byte, error) {
	return gojay.MarshalJSONObject(f)
}

func (f *File) IsNil() bool {
	return f == nil
}

func (f *File) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddStringKey("namespace", f.Namespace)
	enc.AddStringKey("name", f.Name)
	if f.UpdatedAt > 0 {
		enc.AddInt64Key("updatedAt", f.UpdatedAt)
	}
}

func (f *File) GetCollection() CollectionableGroup {
	return &FileCollection{}
}

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
	return path.Join(f.Name, "file.yaml")
}

func (f *File) GetPermChecker() *PermissionSet {
	key := f.GetKey()
	return &PermissionSet{
		FileRefs: map[string]bool{
			key: true,
		},
	}
}

func (f *File) SetField(fieldName string, value any) error {
	return StandardFieldSet(f, fieldName, value)
}

func (f *File) GetField(fieldName string) (any, error) {
	return StandardFieldGet(f, fieldName)
}

func (f *File) Loop(iter func(string, any) error) error {
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
		f.Path = "file/" + oldFileNameProperty
	}
	return node.Decode((*FileWrapper)(f))
}

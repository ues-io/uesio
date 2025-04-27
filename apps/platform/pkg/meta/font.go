package meta

import (
	"fmt"
	"path"

	"gopkg.in/yaml.v3"
)

func NewFont(key string) (*Font, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, fmt.Errorf("bad key for font: %s", key)
	}
	return NewBaseFont(namespace, name), nil
}

func NewBaseFont(namespace, name string) *Font {
	return &Font{BundleableBase: NewBase(namespace, name)}
}

type Font struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	CSSPath        string `yaml:"cssPath" json:"uesio/studio.css_path"`
}

type FontWrapper Font

func (f *Font) GetBytes() ([]byte, error) {
	return nil, nil
}

func (f *Font) GetCollectionName() string {
	return FONT_COLLECTION_NAME
}

func (f *Font) GetCollection() CollectionableGroup {
	return &FontCollection{}
}

func (f *Font) GetBundleFolderName() string {
	return FONT_FOLDER_NAME
}

func (f *Font) GetBasePath() string {
	return f.Name
}

func (f *Font) GetPath() string {
	return path.Join(f.Name, "font.yaml")
}

func (f *Font) SetField(fieldName string, value any) error {
	return StandardFieldSet(f, fieldName, value)
}

func (f *Font) GetField(fieldName string) (any, error) {
	return StandardFieldGet(f, fieldName)
}

func (f *Font) Loop(iter func(string, any) error) error {
	return StandardItemLoop(f, iter)
}

func (f *Font) Len() int {
	return StandardItemLen(f)
}

func (f *Font) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, f.Name)
	if err != nil {
		return err
	}
	return node.Decode((*FontWrapper)(f))
}

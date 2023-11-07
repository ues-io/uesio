package meta

import (
	"errors"
	"path"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

func NewComponentPack(key string) (*ComponentPack, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Component Pack: " + key)
	}
	return NewBaseComponentPack(namespace, name), nil
}

func NewBaseComponentPack(namespace, name string) *ComponentPack {
	return &ComponentPack{BundleableBase: NewBase(namespace, name)}
}

type ComponentPack struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
}

type ComponentPackWrapper ComponentPack

func (cp *ComponentPack) GetBytes() ([]byte, error) {
	return gojay.MarshalJSONObject(cp)
}

func (cp *ComponentPack) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddStringKey("namespace", cp.Namespace)
	enc.AddStringKey("name", cp.Name)
	if cp.UpdatedAt > 0 {
		enc.AddInt64Key("updatedAt", cp.UpdatedAt)
	}
}

func (cp *ComponentPack) IsNil() bool {
	return cp == nil
}

func (cp *ComponentPack) GetCollection() CollectionableGroup {
	return &ComponentPackCollection{}
}

func (cp *ComponentPack) GetCollectionName() string {
	return COMPONENTPACK_COLLECTION_NAME
}

func (cp *ComponentPack) GetBundleFolderName() string {
	return COMPONENTPACK_FOLDER_NAME
}

func (cp *ComponentPack) GetBasePath() string {
	return cp.Name
}

func (cp *ComponentPack) GetPath() string {
	return path.Join(cp.Name, "pack.yaml")
}

func (cp *ComponentPack) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(cp, fieldName, value)
}

func (cp *ComponentPack) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(cp, fieldName)
}

func (cp *ComponentPack) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(cp, iter)
}

func (cp *ComponentPack) Len() int {
	return StandardItemLen(cp)
}

func (cp *ComponentPack) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, cp.Name)
	if err != nil {
		return err
	}
	return node.Decode((*ComponentPackWrapper)(cp))
}

package meta

import (
	"errors"

	"gopkg.in/yaml.v3"
)

func NewStruct(key string) (*Struct, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Collection: " + key)
	}
	return NewBaseStruct(namespace, name), nil
}

func NewBaseStruct(namespace, name string) *Struct {
	return &Struct{BundleableBase: NewBase(namespace, name)}
}

func NewStructs(keys map[string]bool) ([]BundleableItem, error) {
	items := []BundleableItem{}

	for key := range keys {
		newStruct, err := NewStruct(key)
		if err != nil {
			return nil, err
		}
		items = append(items, newStruct)
	}

	return items, nil
}

type Struct struct {
	BuiltIn         `yaml:",inline"`
	BundleableBase  `yaml:",inline"`
	DisplayTemplate string `yaml:"displayTemplate,omitempty" json:"uesio/studio.displayTemplate"`
	Access          string `yaml:"access,omitempty" json:"uesio/studio.access"`
	AccessField     string `yaml:"accessField,omitempty" json:"-"`
	Fields          []FieldMetadata
}

type StructWrapper Struct

func (s *Struct) GetCollectionName() string {
	return STRUCT_COLLECTION_NAME
}

func (s *Struct) GetBundleFolderName() string {
	return STRUCT_FOLDER_NAME
}

func (s *Struct) GetPermChecker() *PermissionSet {
	key := s.GetKey()
	collectionRefs := map[string]CollectionPermission{key: {}}
	return &PermissionSet{
		CollectionRefs: collectionRefs,
	}
}

func (s *Struct) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(s, fieldName, value)
}

func (s *Struct) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(s, fieldName)
}

func (s *Struct) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(s, iter)
}

func (s *Struct) Len() int {
	return StandardItemLen(s)
}

func (s *Struct) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, s.Name)
	if err != nil {
		return err
	}
	return node.Decode((*StructWrapper)(s))
}

func (s *Struct) MarshalYAML() (interface{}, error) {
	return (*StructWrapper)(s), nil
}

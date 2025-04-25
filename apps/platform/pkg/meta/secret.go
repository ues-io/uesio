package meta

import (
	"errors"

	"gopkg.in/yaml.v3"
)

type Secret struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Store          string `yaml:"store,omitempty" json:"uesio/studio.store"`
	ManagedBy      string `yaml:"managedBy,omitempty" json:"uesio/studio.managedby"`
}

type SecretWrapper Secret

func NewSecret(key string) (*Secret, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Secret: " + key)
	}
	return NewBaseSecret(namespace, name), nil
}

func NewBaseSecret(namespace, name string) *Secret {
	return &Secret{BundleableBase: NewBase(namespace, name)}
}

func (s *Secret) GetCollection() CollectionableGroup {
	return &SecretCollection{}
}

func (s *Secret) GetCollectionName() string {
	return SECRET_COLLECTION_NAME
}

func (s *Secret) GetBundleFolderName() string {
	return SECRET_FOLDER_NAME
}

func (s *Secret) SetField(fieldName string, value any) error {
	return StandardFieldSet(s, fieldName, value)
}

func (s *Secret) GetField(fieldName string) (any, error) {
	return StandardFieldGet(s, fieldName)
}

func (s *Secret) Loop(iter func(string, any) error) error {
	return StandardItemLoop(s, iter)
}

func (s *Secret) Len() int {
	return StandardItemLen(s)
}

func (s *Secret) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, s.Name)
	if err != nil {
		return err
	}
	return node.Decode((*SecretWrapper)(s))
}

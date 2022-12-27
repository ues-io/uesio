package meta

import (
	"errors"
	"fmt"

	"gopkg.in/yaml.v3"
)

type Secret struct {
	Name      string `yaml:"name" json:"uesio/studio.name"`
	Store     string `yaml:"store,omitempty" json:"uesio/studio.store"`
	ManagedBy string `yaml:"managedBy,omitempty" json:"uesio/studio.managedby"`
	BuiltIn
	BundleableBase `yaml:",inline"`
}

type SecretWrapper Secret

func NewSecret(key string) (*Secret, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Secret: " + key)
	}
	return &Secret{
		Name: name,
		BundleableBase: BundleableBase{
			Namespace: namespace,
		},
	}, nil
}

func (s *Secret) GetCollectionName() string {
	return SECRET_COLLECTION_NAME
}

func (s *Secret) GetBundleFolderName() string {
	return SECRET_FOLDER_NAME
}

func (s *Secret) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, s.Name)
}

func (s *Secret) GetKey() string {
	return fmt.Sprintf("%s.%s", s.Namespace, s.Name)
}

func (s *Secret) GetPath() string {
	return s.Name + ".yaml"
}

func (s *Secret) GetPermChecker() *PermissionSet {
	return nil
}

func (s *Secret) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(s, fieldName, value)
}

func (s *Secret) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(s, fieldName)
}

func (s *Secret) Loop(iter func(string, interface{}) error) error {
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

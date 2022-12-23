package meta

import (
	"errors"
	"fmt"

	"gopkg.in/yaml.v3"
)

func NewAuthSource(key string) (*AuthSource, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for AuthSource: " + key)
	}
	return &AuthSource{
		Name: name,
		BundleableBase: BundleableBase{
			Namespace: namespace,
		},
	}, nil
}

type AuthSource struct {
	Name        string `yaml:"name" json:"uesio/studio.name"`
	Type        string `yaml:"type" json:"uesio/studio.type"`
	Credentials string `yaml:"credentials" json:"uesio/studio.credentials"`
	BuiltIn
	BundleableBase `yaml:",inline"`
}

type AuthSourceWrapper AuthSource

func (as *AuthSource) GetCollectionName() string {
	return as.GetBundleGroup().GetName()
}

func (as *AuthSource) GetCollection() CollectionableGroup {
	return &AuthSourceCollection{}
}

func (as *AuthSource) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, as.Name)
}

func (as *AuthSource) GetBundleGroup() BundleableGroup {
	return &AuthSourceCollection{}
}

func (as *AuthSource) GetKey() string {
	return fmt.Sprintf("%s.%s", as.Namespace, as.Name)
}

func (as *AuthSource) GetPath() string {
	return as.Name + ".yaml"
}

func (as *AuthSource) GetPermChecker() *PermissionSet {
	return nil
}

func (as *AuthSource) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(as, fieldName, value)
}

func (as *AuthSource) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(as, fieldName)
}

func (as *AuthSource) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(as, iter)
}

func (as *AuthSource) Len() int {
	return StandardItemLen(as)
}

func (as *AuthSource) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, as.Name)
	if err != nil {
		return err
	}
	return node.Decode((*AuthSourceWrapper)(as))
}

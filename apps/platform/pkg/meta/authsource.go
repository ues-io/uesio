package meta

import (
	"errors"

	"gopkg.in/yaml.v3"
)

func NewAuthSource(key string) (*AuthSource, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for AuthSource: " + key)
	}
	return NewBaseAuthSource(namespace, name), nil
}

func NewBaseAuthSource(namespace, name string) *AuthSource {
	return &AuthSource{BundleableBase: NewBase(namespace, name)}
}

type AuthSource struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Type           string `yaml:"type" json:"uesio/studio.type"`
	Credentials    string `yaml:"credentials" json:"uesio/studio.credentials"`
}

type AuthSourceWrapper AuthSource

func (as *AuthSource) GetCollectionName() string {
	return AUTHSOURCE_COLLECTION_NAME
}

func (as *AuthSource) GetCollection() CollectionableGroup {
	return &AuthSourceCollection{}
}

func (as *AuthSource) GetBundleFolderName() string {
	return AUTHSOURCE_FOLDER_NAME
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
	if err := validateNodeName(node, as.Name); err != nil {
		return err
	}
	if err := node.Decode((*AuthSourceWrapper)(as)); err != nil {
		return err
	}
	as.Credentials = GetFullyQualifiedKey(as.Credentials, as.Namespace)
	return nil
}

func (as *AuthSource) MarshalYAML() (interface{}, error) {
	as.Credentials = GetLocalizedKey(as.Credentials, as.Namespace)
	return (*AuthSourceWrapper)(as), nil
}

func (as *AuthSource) UnmarshalJSON(data []byte) error {
	type alias AuthSource
	return refScanner((*alias)(as), data)
}

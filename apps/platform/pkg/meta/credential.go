package meta

import (
	"errors"

	"gopkg.in/yaml.v3"
)

func NewCredential(key string) (*Credential, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Credential: " + key)
	}
	return NewBaseCredential(namespace, name), nil
}

func NewBaseCredential(namespace, name string) *Credential {
	return &Credential{BundleableBase: NewBase(namespace, name)}
}

type CredentialEntry struct {
	Type  string `yaml:"type" json:"type"`
	Value string `yaml:"value" json:"value"`
}

type Credential struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Type           string                     `yaml:"type" json:"uesio/studio.type"`
	Entries        map[string]CredentialEntry `yaml:"entries" json:"uesio/studio.entries"`
}

type CredentialWrapper Credential

func (c *Credential) GetCollectionName() string {
	return CREDENTIAL_COLLECTION_NAME
}

func (c *Credential) GetBundleFolderName() string {
	return CREDENTIAL_FOLDER_NAME
}

func (c *Credential) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(c, fieldName, value)
}

func (c *Credential) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(c, fieldName)
}

func (c *Credential) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(c, iter)
}

func (c *Credential) Len() int {
	return StandardItemLen(c)
}

func (c *Credential) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, c.Name)
	if err != nil {
		return err
	}
	return node.Decode((*CredentialWrapper)(c))
}

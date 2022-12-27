package meta

import (
	"errors"
	"fmt"

	"gopkg.in/yaml.v3"
)

func NewCredential(key string) (*Credential, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Credential: " + key)
	}
	return &Credential{
		Name: name,
		BundleableBase: BundleableBase{
			Namespace: namespace,
		},
	}, nil
}

type CredentialEntry struct {
	Type  string `yaml:"type" json:"uesio/studio.type"`
	Value string `yaml:"value" json:"uesio/studio.value"`
}

type Credential struct {
	Name    string                     `yaml:"name" json:"uesio/studio.name"`
	Entries map[string]CredentialEntry `yaml:"entries" json:"uesio/studio.entries"`
	BuiltIn
	BundleableBase `yaml:",inline"`
}

type CredentialWrapper Credential

func (c *Credential) GetCollectionName() string {
	return CREDENTIAL_COLLECTION_NAME
}

func (c *Credential) GetBundleFolderName() string {
	return CREDENTIAL_FOLDER_NAME
}

func (c *Credential) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, c.Name)
}

func (c *Credential) GetKey() string {
	return fmt.Sprintf("%s.%s", c.Namespace, c.Name)
}

func (c *Credential) GetPath() string {
	return c.Name + ".yaml"
}

func (c *Credential) GetPermChecker() *PermissionSet {
	return nil
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

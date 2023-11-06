package meta

import (
	"errors"

	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/types/credentials"
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

type Credential struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Type           string                           `yaml:"type" json:"uesio/studio.type"`
	Entries        credentials.CredentialEntriesMap `yaml:"entries,omitempty" json:"uesio/studio.entries"`
	// API_KEY
	APIKey *credentials.APIKeyCredentials `yaml:"apiKey,omitempty" json:"uesio/studio.api_key"`
	// AWS_KEY
	AwsKey *credentials.AwsKeyCredentials `yaml:"awsKey,omitempty" json:"uesio/studio.aws_key"`
	// AWS_ASSUME_ROLE
	AwsAssumeRole *credentials.AwsSTSCredentials `yaml:"awsAssumeRole,omitempty" json:"uesio/studio.aws_assume_role"`
	// OAUTH2_CREDENTIALS
	OAuth2 *credentials.OAuth2Credentials `yaml:"oauth2,omitempty" json:"uesio/studio.oauth2"`
	// POSTGRESQL_CONNECTION
	Postgres *credentials.PostgreSQLConnection `yaml:"pg,omitempty" json:"uesio/studio.postgresql_connection"`
	// USERNAME_PASSWORD
	UsernamePassword *credentials.UsernamePasswordCredentials `yaml:"usernamePassword,omitempty" json:"uesio/studio.username_password"`
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

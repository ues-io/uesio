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
	Type           string `yaml:"type" json:"uesio/studio.type"`
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
	// arbitrary entries
	Entries credentials.CredentialEntriesMap `yaml:"entries,omitempty" json:"uesio/studio.entries"`
}

type CredentialWrapper Credential

func (c *Credential) GetCollection() CollectionableGroup {
	return &CredentialCollection{}
}

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

type defaultNamespaceMapper = func(input, defaultNamespace string) string

var createEntryMapper = func(mapper defaultNamespaceMapper, defaultNamespace string) credentials.EntryMapper {
	return func(entry *credentials.CredentialEntry) string {
		return mapper(entry.Value, defaultNamespace)
	}
}

func (c *Credential) UnmarshalYAML(node *yaml.Node) error {
	if err := validateNodeName(node, c.Name); err != nil {
		return err
	}
	// Unmarshal the YAML node directly
	if err := node.Decode((*CredentialWrapper)(c)); err != nil {
		return err
	}
	// Now that we've unmarshalled, we need to fully-qualify all metadata references within our entries
	c.MapEntries(createEntryMapper(GetFullyQualifiedKey, c.Namespace))
	return nil
}

func (c *Credential) MarshalYAML() (interface{}, error) {
	// Localize metadata references within credential entries
	c.MapEntries(createEntryMapper(GetLocalizedKey, c.Namespace))
	return (*CredentialWrapper)(c), nil
}

func (c *Credential) GetTypeSpecificCredentialContainer() credentials.CredentialContainer {
	switch c.Type {
	case "API_KEY":
		return c.APIKey
	case "AWS_KEY":
		return c.AwsKey
	case "AWS_ASSUME_ROLE":
		return c.AwsAssumeRole
	case "OAUTH2_CREDENTIALS":
		return c.OAuth2
	case "POSTGRESQL_CONNECTION":
		return c.Postgres
	case "USERNAME_PASSWORD":
		return c.UsernamePassword
	}
	return nil
}

// MapEntries invokes an entry mapper on all CredentialEntry instances defined
// within the credential's type-specific container, and within the generic entries container
func (c *Credential) MapEntries(mapper credentials.EntryMapper) {
	if typeSpecificContainer := c.GetTypeSpecificCredentialContainer(); typeSpecificContainer != nil && !typeSpecificContainer.IsNil() {
		typeSpecificContainer.Map(mapper)
	}
	if c.Entries != nil {
		c.Entries.Map(mapper)
	}
}

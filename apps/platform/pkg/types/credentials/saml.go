package credentials

type SAMLCredentials struct {
	MetadataURL string `yaml:"metadataUrl" json:"metadata_url"`
	Certificate string `yaml:"certificate" json:"certificate"`
	PrivateKey  string `yaml:"privateKey" json:"private_key"`
}

func (c *SAMLCredentials) IsNil() bool {
	return c == nil
}

// Map iterates over each CredentialEntry and returns a new value for the entry
func (c *SAMLCredentials) Map(mapper EntryMapper) {
	c.MetadataURL = mapper(&CredentialEntry{
		Name:  "metadataUrl",
		Type:  "configvalue",
		Value: c.MetadataURL,
	})
	c.Certificate = mapper(&CredentialEntry{
		Name:  "certificate",
		Type:  "secret",
		Value: c.Certificate,
	})
	c.PrivateKey = mapper(&CredentialEntry{
		Name:  "privateKey",
		Type:  "secret",
		Value: c.PrivateKey,
	})
}

package credentials

type SAMLCredentials struct {
	EntityID       string `yaml:"entityId" json:"entity_id"`
	MetadataXMLURL string `yaml:"metadataXmlUrl" json:"metadata_xml_url"`
	MetadataXML    string `yaml:"metadataXml" json:"metadata_xml"`
	Certificate    string `yaml:"certificate" json:"certificate"`
	PrivateKey     string `yaml:"privateKey" json:"private_key"`
}

func (c *SAMLCredentials) IsNil() bool {
	return c == nil
}

// Map iterates over each CredentialEntry and returns a new value for the entry
func (c *SAMLCredentials) Map(mapper EntryMapper) {
	c.EntityID = mapper(&CredentialEntry{
		Name:  "entityId",
		Type:  "configvalue",
		Value: c.EntityID,
	})
	c.MetadataXMLURL = mapper(&CredentialEntry{
		Name:  "metadataXmlUrl",
		Type:  "configvalue",
		Value: c.MetadataXMLURL,
	})
	c.MetadataXML = mapper(&CredentialEntry{
		Name:  "metadataXml",
		Type:  "configvalue",
		Value: c.MetadataXML,
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

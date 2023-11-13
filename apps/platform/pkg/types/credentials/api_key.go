package credentials

type APIKeyCredentials struct {
	Key string `yaml:"key" json:"key"`
}

func (c *APIKeyCredentials) IsNil() bool {
	return c == nil
}

// Map iterates over each CredentialEntry and returns a new value for the entry
func (c *APIKeyCredentials) Map(mapper EntryMapper) {
	c.Key = mapper(&CredentialEntry{
		Name:  "apikey",
		Type:  "secret",
		Value: c.Key,
	})
}

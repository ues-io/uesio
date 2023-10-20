package credentials

type APIKeyCredentials struct {
	Key string `yaml:"key" json:"key"`
}

func (c *APIKeyCredentials) IsNil() bool {
	return c == nil
}

func (c *APIKeyCredentials) GetEntriesMap() CredentialEntriesMap {
	return CredentialEntriesMap{
		"apikey": &CredentialEntry{
			Type:  "secret",
			Value: c.Key,
		},
	}
}

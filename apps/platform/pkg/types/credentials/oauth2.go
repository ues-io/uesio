package credentials

type OAuth2Credentials struct {
	ClientId     string `yaml:"clientId" json:"client_id"`
	ClientSecret string `yaml:"clientSecret" json:"client_secret"`
	TokenURL     string `yaml:"tokenUrl" json:"token_url"`
	AuthorizeURL string `yaml:"authorizeUrl" json:"authorize_url"`
	Scopes       string `yaml:"scopes" json:"scopes"`
}

func (c *OAuth2Credentials) IsNil() bool {
	return c == nil
}

func (c *OAuth2Credentials) GetEntriesMap() CredentialEntriesMap {
	return CredentialEntriesMap{
		"clientId": &CredentialEntry{
			Type:  "secret",
			Value: c.ClientId,
		},
		"clientSecret": &CredentialEntry{
			Type:  "secret",
			Value: c.ClientSecret,
		},
		"tokenUrl": &CredentialEntry{
			Type:  "configvalue",
			Value: c.TokenURL,
		},
		"authorizeUrl": &CredentialEntry{
			Type:  "configvalue",
			Value: c.AuthorizeURL,
		},
		"scopes": &CredentialEntry{
			Type:  "configvalue",
			Value: c.Scopes,
		},
	}
}

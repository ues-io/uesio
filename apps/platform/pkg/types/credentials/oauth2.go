package credentials

type OAuth2Credentials struct {
	ClientId                  string `yaml:"clientId" json:"client_id"`
	ClientSecret              string `yaml:"clientSecret" json:"client_secret"`
	TokenURL                  string `yaml:"tokenUrl" json:"token_url"`
	AuthorizeURL              string `yaml:"authorizeUrl" json:"authorize_url"`
	Scopes                    string `yaml:"scopes,omitempty" json:"scopes"`
	CustomAuthorizationHeader string `yaml:"customAuthorizationHeader,omitempty" json:"custom_authorization_header"`
}

func (c *OAuth2Credentials) IsNil() bool {
	return c == nil
}

// Map iterates over each CredentialEntry and returns a new value for the entry
func (c *OAuth2Credentials) Map(mapper EntryMapper) {
	c.ClientId = mapper(&CredentialEntry{
		Name:  "clientId",
		Type:  "secret",
		Value: c.ClientId,
	})
	c.ClientSecret = mapper(&CredentialEntry{
		Name:  "clientSecret",
		Type:  "secret",
		Value: c.ClientSecret,
	})
	c.TokenURL = mapper(&CredentialEntry{
		Name:  "tokenUrl",
		Type:  "configvalue",
		Value: c.TokenURL,
	})
	c.AuthorizeURL = mapper(&CredentialEntry{
		Name:  "authorizeUrl",
		Type:  "configvalue",
		Value: c.AuthorizeURL,
	})
	c.Scopes = mapper(&CredentialEntry{
		Name:  "scopes",
		Type:  "configvalue",
		Value: c.Scopes,
	})
	c.CustomAuthorizationHeader = mapper(&CredentialEntry{
		Name:  "customAuthorizationHeader",
		Type:  "merge",
		Value: c.CustomAuthorizationHeader,
	})
}

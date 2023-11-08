package credentials

type UsernamePasswordCredentials struct {
	Username string `yaml:"username" json:"username"`
	Password string `yaml:"password" json:"password"`
}

func (c *UsernamePasswordCredentials) IsNil() bool {
	return c == nil
}

// Map iterates over each CredentialEntry and returns a new value for the entry
func (c *UsernamePasswordCredentials) Map(mapper EntryMapper) {
	c.Username = mapper(&CredentialEntry{
		Name:  "username",
		Type:  "secret",
		Value: c.Username,
	})
	c.Password = mapper(&CredentialEntry{
		Name:  "password",
		Type:  "secret",
		Value: c.Password,
	})

}

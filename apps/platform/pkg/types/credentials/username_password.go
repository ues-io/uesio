package credentials

type UsernamePasswordCredentials struct {
	Username string `yaml:"username" json:"username"`
	Password string `yaml:"password" json:"password"`
}

func (c *UsernamePasswordCredentials) IsNil() bool {
	return c == nil
}

func (c *UsernamePasswordCredentials) GetEntriesMap() CredentialEntriesMap {
	return CredentialEntriesMap{
		"username": &CredentialEntry{
			Type:  "secret",
			Value: c.Username,
		},
		"password": &CredentialEntry{
			Type:  "secret",
			Value: c.Password,
		},
	}
}

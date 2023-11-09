package credentials

type PostgreSQLConnection struct {
	Host     string `yaml:"host" json:"host"`
	Port     string `yaml:"port" json:"port"`
	Database string `yaml:"database" json:"database"`
	Username string `yaml:"username" json:"username"`
	Password string `yaml:"password" json:"password"`
}

func (c *PostgreSQLConnection) IsNil() bool {
	return c == nil
}

// Map iterates over each CredentialEntry and returns a new value for the entry
func (c *PostgreSQLConnection) Map(mapper EntryMapper) {
	c.Host = mapper(&CredentialEntry{
		Name:  "host",
		Type:  "configvalue",
		Value: c.Host,
	})
	c.Port = mapper(&CredentialEntry{
		Name:  "port",
		Type:  "configvalue",
		Value: c.Port,
	})
	c.Database = mapper(&CredentialEntry{
		Name:  "database",
		Type:  "secret",
		Value: c.Database,
	})
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

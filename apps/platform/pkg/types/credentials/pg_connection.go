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

func (c *PostgreSQLConnection) GetEntriesMap() CredentialEntriesMap {
	return CredentialEntriesMap{
		"host": &CredentialEntry{
			Type:  "configvalue",
			Value: c.Host,
		},
		"port": &CredentialEntry{
			Type:  "configvalue",
			Value: c.Port,
		},
		"database": &CredentialEntry{
			Type:  "secret",
			Value: c.Database,
		},
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

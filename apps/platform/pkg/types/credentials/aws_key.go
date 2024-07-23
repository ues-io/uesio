package credentials

type AwsKeyCredentials struct {
	AccessKeyId     string `yaml:"accessKeyId" json:"access_key_id"`
	SecretAccessKey string `yaml:"secretAccessKey" json:"secret_access_key"`
	SessionToken    string `yaml:"sessionToken" json:"session_token"`
	Region          string `yaml:"region" json:"region"`
	Endpoint        string `yaml:"endpoint" json:"endpoint"`
}

func (c *AwsKeyCredentials) IsNil() bool {
	return c == nil
}

// Map iterates over each CredentialEntry and returns a new value for the entry
func (c *AwsKeyCredentials) Map(mapper EntryMapper) {
	c.AccessKeyId = mapper(&CredentialEntry{
		Name:  "accessKeyId",
		Type:  "secret",
		Value: c.AccessKeyId,
	})
	c.SecretAccessKey = mapper(&CredentialEntry{
		Name:  "secretAccessKey",
		Type:  "secret",
		Value: c.SecretAccessKey,
	})
	c.SessionToken = mapper(&CredentialEntry{
		Name:  "sessionToken",
		Type:  "secret",
		Value: c.SessionToken,
	})
	c.Region = mapper(&CredentialEntry{
		Name:  "region",
		Type:  "configvalue",
		Value: c.Region,
	})
	c.Endpoint = mapper(&CredentialEntry{
		Name:  "endpoint",
		Type:  "configvalue",
		Value: c.Endpoint,
	})
}

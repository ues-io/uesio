package credentials

type AwsKeyCredentials struct {
	AccessKeyId     string `yaml:"accessKeyId" json:"access_key_id"`
	SecretAccessKey string `yaml:"secretAccessKey" json:"secret_access_key"`
	SessionToken    string `yaml:"sessionToken" json:"session_token"`
	Region          string `yaml:"region" json:"region"`
}

func (c *AwsKeyCredentials) IsNil() bool {
	return c == nil
}

func (c *AwsKeyCredentials) GetEntriesMap() CredentialEntriesMap {
	return CredentialEntriesMap{
		"accessKeyId": &CredentialEntry{
			Type:  "secret",
			Value: c.AccessKeyId,
		},
		"secretAccessKey": &CredentialEntry{
			Type:  "secret",
			Value: c.SecretAccessKey,
		},
		"sessionToken": &CredentialEntry{
			Type:  "secret",
			Value: c.SessionToken,
		},
		"region": &CredentialEntry{
			Type:  "configvalue",
			Value: c.Region,
		},
	}
}

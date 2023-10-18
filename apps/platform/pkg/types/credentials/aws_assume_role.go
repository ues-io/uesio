package credentials

type AwsSTSCredentials struct {
	AssumeRoleARN string `yaml:"assumeRoleARN" json:"assume_role_arn"`
	Region        string `yaml:"region" json:"region"`
}

func (c *AwsSTSCredentials) IsNil() bool {
	return c == nil
}

func (c *AwsSTSCredentials) GetEntriesMap() CredentialEntriesMap {
	return CredentialEntriesMap{
		"assumeRoleARN": &CredentialEntry{
			Type:  "secret",
			Value: c.AssumeRoleARN,
		},
		"region": &CredentialEntry{
			Type:  "configvalue",
			Value: c.Region,
		},
	}
}

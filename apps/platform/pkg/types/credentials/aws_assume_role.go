package credentials

type AwsSTSCredentials struct {
	AssumeRoleARN string `yaml:"assumeRoleARN" json:"assume_role_arn"`
	Region        string `yaml:"region" json:"region"`
}

func (c *AwsSTSCredentials) IsNil() bool {
	return c == nil
}

// Map iterates over each CredentialEntry and returns a new value for the entry
func (c *AwsSTSCredentials) Map(mapper EntryMapper) {
	c.AssumeRoleARN = mapper(&CredentialEntry{
		Name:  "assumeRoleARN",
		Type:  "secret",
		Value: c.AssumeRoleARN,
	})
	c.Region = mapper(&CredentialEntry{
		Name:  "region",
		Type:  "configvalue",
		Value: c.Region,
	})
}

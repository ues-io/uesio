package credentials

type APIKeyCredentials struct {
	Key           string `yaml:"key" json:"key"`
	Location      string `yaml:"location" json:"location"`
	LocationName  string `yaml:"locationName" json:"locationName"`
	LocationValue string `yaml:"locationValue,omitempty" json:"locationValue"`
}

func (c *APIKeyCredentials) IsNil() bool {
	return c == nil
}

// Map iterates over each CredentialEntry and returns a new value for the entry
func (c *APIKeyCredentials) Map(mapper EntryMapper) {
	c.Key = mapper(&CredentialEntry{
		Name:  "apikey",
		Type:  "secret",
		Value: c.Key,
	})
	c.Location = mapper(&CredentialEntry{
		Name:  "location",
		Type:  "select",
		Value: c.Location,
	})
	c.LocationName = mapper(&CredentialEntry{
		Name:  "locationName",
		Type:  "text",
		Value: c.LocationName,
	})
	c.LocationValue = mapper(&CredentialEntry{
		Name:  "locationValue",
		Type:  "text",
		Value: c.LocationValue,
	})
}

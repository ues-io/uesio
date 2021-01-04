package metadata

// SiteDomain struct
type SiteDomain struct {
	ID     string `uesio:"uesio.id"`
	Site   string `uesio:"uesio.site"`
	Type   string `uesio:"uesio.type"`
	Domain string `uesio:"uesio.domain"`
}

// GetCollectionName function
func (s *SiteDomain) GetCollectionName() string {
	return s.GetCollection().GetName()
}

// GetCollection function
func (s *SiteDomain) GetCollection() CollectionableGroup {
	var sdc SiteDomainCollection
	return &sdc
}

// SetField function
func (s *SiteDomain) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(s, fieldName, value)
}

// GetField function
func (s *SiteDomain) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(s, fieldName)
}

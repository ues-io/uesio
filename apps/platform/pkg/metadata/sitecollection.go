package metadata

// SiteCollection slice
type SiteCollection []Site

// GetName function
func (s *SiteCollection) GetName() string {
	return "sites"
}

// GetFields function
func (sc *SiteCollection) GetFields() []string {
	return []string{"id", "appref", "name", "versionref", "bundleid"}
}

// UnMarshal function
func (sc *SiteCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(sc, data)
}

// Marshal function
func (sc *SiteCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(sc)
}

// GetItem function
func (sc *SiteCollection) GetItem(index int) CollectionableItem {
	actual := *sc
	return &actual[index]
}

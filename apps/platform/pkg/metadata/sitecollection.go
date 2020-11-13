package metadata

// SiteCollection slice
type SiteCollection []Site

// GetName function
func (sc *SiteCollection) GetName() string {
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

// Loop function
func (sc *SiteCollection) Loop(iter func(item CollectionableItem) error) error {
	for _, item := range *sc {
		err := iter(&item)
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (sc *SiteCollection) Len() int {
	return len(*sc)
}

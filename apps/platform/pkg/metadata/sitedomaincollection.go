package metadata

// SiteDomainCollection slice
type SiteDomainCollection []SiteDomain

// GetName function
func (sdc *SiteDomainCollection) GetName() string {
	return "sitedomains"
}

// GetFields function
func (sdc *SiteDomainCollection) GetFields() []string {
	return []string{"id", "domain", "type", "site"}
}

// UnMarshal function
func (sdc *SiteDomainCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(sdc, data)
}

// Marshal function
func (sdc *SiteDomainCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(sdc)
}

// GetItem function
func (sdc *SiteDomainCollection) GetItem(index int) CollectionableItem {
	actual := *sdc
	return &actual[index]
}

// Loop function
func (sdc *SiteDomainCollection) Loop(iter func(item CollectionableItem) error) error {
	for _, item := range *sdc {
		err := iter(&item)
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (sdc *SiteDomainCollection) Len() int {
	return len(*sdc)
}

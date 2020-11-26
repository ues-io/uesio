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

// AddItem function
func (sdc *SiteDomainCollection) AddItem(item CollectionableItem) {
	*sdc = append(*sdc, *item.(*SiteDomain))
}

// Loop function
func (sdc *SiteDomainCollection) Loop(iter func(item CollectionableItem) error) error {
	for index := range *sdc {
		err := iter(sdc.GetItem(index))
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

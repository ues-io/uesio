package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// SiteDomainCollection slice
type SiteDomainCollection []SiteDomain

// GetName function
func (sdc *SiteDomainCollection) GetName() string {
	return "sitedomains"
}

// GetFields function
func (sdc *SiteDomainCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(sdc)
}

// GetItem function
func (sdc *SiteDomainCollection) GetItem(index int) LoadableItem {
	actual := *sdc
	return &actual[index]
}

// AddItem function
func (sdc *SiteDomainCollection) AddItem(item LoadableItem) {
	*sdc = append(*sdc, *item.(*SiteDomain))
}

// NewItem function
func (sdc *SiteDomainCollection) NewItem() LoadableItem {
	return &SiteDomain{}
}

// Loop function
func (sdc *SiteDomainCollection) Loop(iter func(item LoadableItem) error) error {
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

package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// SiteDomainCollection slice
type SiteDomainCollection []SiteDomain

// GetName function
func (sdc *SiteDomainCollection) GetName() string {
	return "sitedomains"
}

// GetFields function
func (sdc *SiteDomainCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(sdc)
}

// GetItem function
func (sdc *SiteDomainCollection) GetItem(index int) adapters.LoadableItem {
	return &(*sdc)[index]
}

// AddItem function
func (sdc *SiteDomainCollection) AddItem(item adapters.LoadableItem) {
	*sdc = append(*sdc, *item.(*SiteDomain))
}

// NewItem function
func (sdc *SiteDomainCollection) NewItem() adapters.LoadableItem {
	return &SiteDomain{}
}

// Loop function
func (sdc *SiteDomainCollection) Loop(iter func(item adapters.LoadableItem) error) error {
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

// GetItems function
func (sdc *SiteDomainCollection) GetItems() interface{} {
	return sdc
}

// Slice function
func (sdc *SiteDomainCollection) Slice(start int, end int) error {
	return nil
}

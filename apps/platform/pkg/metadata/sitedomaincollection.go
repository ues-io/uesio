package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/metadata/loadable"
)

// SiteDomainCollection slice
type SiteDomainCollection []SiteDomain

// GetName function
func (sdc *SiteDomainCollection) GetName() string {
	return "sitedomains"
}

// GetFields function
func (sdc *SiteDomainCollection) GetFields() []string {
	return StandardGetFields(sdc)
}

// GetItem function
func (sdc *SiteDomainCollection) GetItem(index int) loadable.Item {
	return &(*sdc)[index]
}

// AddItem function
func (sdc *SiteDomainCollection) AddItem(item loadable.Item) {
	*sdc = append(*sdc, *item.(*SiteDomain))
}

// NewItem function
func (sdc *SiteDomainCollection) NewItem() loadable.Item {
	return &SiteDomain{}
}

// Loop function
func (sdc *SiteDomainCollection) Loop(iter func(item loadable.Item) error) error {
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
func (sdc *SiteDomainCollection) Slice(start int, end int) {

}

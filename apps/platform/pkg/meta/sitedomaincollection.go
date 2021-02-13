package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// SiteDomainCollection slice
type SiteDomainCollection []SiteDomain

// GetName function
func (sdc *SiteDomainCollection) GetName() string {
	return "uesio.sitedomains"
}

// GetFields function
func (sdc *SiteDomainCollection) GetFields() []string {
	return StandardGetFields(&SiteDomain{})
}

// GetItem function
func (sdc *SiteDomainCollection) GetItem(index int) loadable.Item {
	return &(*sdc)[index]
}

// NewItem function
func (sdc *SiteDomainCollection) NewItem() loadable.Item {
	*sdc = append(*sdc, SiteDomain{})
	return &(*sdc)[len(*sdc)-1]
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

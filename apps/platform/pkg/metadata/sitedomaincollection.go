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
	actual := *sdc
	return &actual[index]
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

// Sort function
func (sdc *SiteDomainCollection) Sort(order []adapters.LoadRequestOrder, collectionMetadata *adapters.CollectionMetadata) {
	println("Sort")
}

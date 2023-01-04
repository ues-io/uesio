package meta

import (
	"strconv"
)

type SiteDomainCollection []*SiteDomain

var SITEDOMAIN_COLLECTION_NAME = "uesio/studio.sitedomain"
var SITEDOMAIN_FIELDS = StandardGetFields(&SiteDomain{})

func (sdc *SiteDomainCollection) GetName() string {
	return SITEDOMAIN_COLLECTION_NAME
}

func (sdc *SiteDomainCollection) GetFields() []string {
	return SITEDOMAIN_FIELDS
}

func (sdc *SiteDomainCollection) NewItem() Item {
	return &SiteDomain{}
}

func (sdc *SiteDomainCollection) AddItem(item Item) {
	*sdc = append(*sdc, item.(*SiteDomain))
}

func (sdc *SiteDomainCollection) Loop(iter GroupIterator) error {
	for index, sd := range *sdc {
		err := iter(sd, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (sdc *SiteDomainCollection) Len() int {
	return len(*sdc)
}

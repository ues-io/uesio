package meta

import (
	"strconv"
)

type SiteDomainCollection []*SiteDomain

func (sdc *SiteDomainCollection) GetName() string {
	return "uesio/studio.sitedomain"
}

func (sdc *SiteDomainCollection) GetFields() []string {
	return StandardGetFields(&SiteDomain{})
}

func (sdc *SiteDomainCollection) GetItem(index int) Item {
	return (*sdc)[index]
}

func (sdc *SiteDomainCollection) NewItem() Item {
	sd := &SiteDomain{}
	*sdc = append(*sdc, sd)
	return sd
}

func (sdc *SiteDomainCollection) Loop(iter GroupIterator) error {
	for index := range *sdc {
		err := iter(sdc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (sdc *SiteDomainCollection) Len() int {
	return len(*sdc)
}

func (sdc *SiteDomainCollection) GetItems() interface{} {
	return *sdc
}

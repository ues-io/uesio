package meta

import (
	"strconv"
)

type LicensePricingItemCollection []*LicensePricingItem

func (lpic *LicensePricingItemCollection) GetName() string {
	return "uesio/studio.licensepricingitem"
}

func (lpic *LicensePricingItemCollection) GetFields() []string {
	return StandardGetFields(&LicensePricingItem{})
}

func (lpic *LicensePricingItemCollection) GetItem(index int) Item {
	return (*lpic)[index]
}

func (lpic *LicensePricingItemCollection) NewItem() Item {
	return &LicensePricingItem{}
}

func (lpic *LicensePricingItemCollection) AddItem(item Item) {
	*lpic = append(*lpic, item.(*LicensePricingItem))
}

func (lpic *LicensePricingItemCollection) Loop(iter GroupIterator) error {
	for index := range *lpic {
		err := iter(lpic.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (lpic *LicensePricingItemCollection) Len() int {
	return len(*lpic)
}

func (lpic *LicensePricingItemCollection) GetItems() interface{} {
	return *lpic
}

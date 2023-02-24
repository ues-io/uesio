package meta

import (
	"strconv"
)

type LicensePricingItemCollection []*LicensePricingItem

var LICENSEPRICINGITEM_COLLECTION_NAME = "uesio/studio.licensepricingitem"
var LICENSEPRICINGITEM_FIELDS = StandardGetFields(&LicensePricingItem{})

func (lpic *LicensePricingItemCollection) GetName() string {
	return LICENSEPRICINGITEM_COLLECTION_NAME
}

func (lpic *LicensePricingItemCollection) GetFields() []string {
	return LICENSEPRICINGITEM_FIELDS
}

func (lpic *LicensePricingItemCollection) NewItem() Item {
	return &LicensePricingItem{}
}

func (lpic *LicensePricingItemCollection) AddItem(item Item) error {
	*lpic = append(*lpic, item.(*LicensePricingItem))
	return nil
}

func (lpic *LicensePricingItemCollection) Loop(iter GroupIterator) error {
	for index, lpi := range *lpic {
		err := iter(lpi, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (lpic *LicensePricingItemCollection) Len() int {
	return len(*lpic)
}

package meta

import (
	"strconv"
)

type InvoiceLineItemCollection []*InvoiceLineItem

var INVOICELINEITEM_COLLECTION_NAME = "uesio/studio.invoicelineitem"
var INVOICELINEITEM_FIELDS = StandardGetFields(&Invoice{})

func (lc *InvoiceLineItemCollection) GetName() string {
	return INVOICELINEITEM_COLLECTION_NAME
}

func (lc *InvoiceLineItemCollection) GetFields() []string {
	return INVOICELINEITEM_FIELDS
}

func (lc *InvoiceLineItemCollection) NewItem() Item {
	return &Invoice{}
}

func (lc *InvoiceLineItemCollection) AddItem(item Item) {
	*lc = append(*lc, item.(*InvoiceLineItem))
}

func (lc *InvoiceLineItemCollection) Loop(iter GroupIterator) error {
	for index, l := range *lc {
		err := iter(l, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (lc *InvoiceLineItemCollection) Len() int {
	return len(*lc)
}

package meta

import (
	"strconv"
)

type InvoiceCollection []*Invoice

var INVOICE_COLLECTION_NAME = "uesio/studio.invoice"
var INVOICE_FIELDS = StandardGetFields(&Invoice{})

func (lc *InvoiceCollection) GetName() string {
	return INVOICE_COLLECTION_NAME
}

func (lc *InvoiceCollection) GetFields() []string {
	return INVOICE_FIELDS
}

func (lc *InvoiceCollection) NewItem() Item {
	return &Invoice{}
}

func (lc *InvoiceCollection) AddItem(item Item) error {
	*lc = append(*lc, item.(*Invoice))
	return nil
}

func (lc *InvoiceCollection) Loop(iter GroupIterator) error {
	for index, l := range *lc {
		err := iter(l, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (lc *InvoiceCollection) Len() int {
	return len(*lc)
}

package meta

import (
	"strconv"
)

type InvoiceLineItemCollection []*InvoiceLineItem

func (lc *InvoiceLineItemCollection) GetName() string {
	return "uesio/studio.invoicelineitem"
}

func (lc *InvoiceLineItemCollection) GetFields() []string {
	return StandardGetFields(&Invoice{})
}

func (lc *InvoiceLineItemCollection) GetItem(index int) Item {
	return (*lc)[index]
}

func (lc *InvoiceLineItemCollection) NewItem() Item {
	return &Invoice{}
}

func (lc *InvoiceLineItemCollection) AddItem(item Item) {
	*lc = append(*lc, item.(*InvoiceLineItem))
}

func (lc *InvoiceLineItemCollection) Loop(iter GroupIterator) error {
	for index := range *lc {
		err := iter(lc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (lc *InvoiceLineItemCollection) Len() int {
	return len(*lc)
}

func (lc *InvoiceLineItemCollection) GetItems() interface{} {
	return *lc
}

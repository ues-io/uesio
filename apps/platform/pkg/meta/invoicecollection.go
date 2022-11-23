package meta

import (
	"strconv"
)

type InvoiceCollection []*Invoice

func (lc *InvoiceCollection) GetName() string {
	return "uesio/studio.invoice"
}

func (lc *InvoiceCollection) GetFields() []string {
	return StandardGetFields(&Invoice{})
}

func (lc *InvoiceCollection) GetItem(index int) Item {
	return (*lc)[index]
}

func (lc *InvoiceCollection) NewItem() Item {
	return &Invoice{}
}

func (lc *InvoiceCollection) AddItem(item Item) {
	*lc = append(*lc, item.(*Invoice))
}

func (lc *InvoiceCollection) Loop(iter GroupIterator) error {
	for index := range *lc {
		err := iter(lc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (lc *InvoiceCollection) Len() int {
	return len(*lc)
}

func (lc *InvoiceCollection) GetItems() interface{} {
	return *lc
}

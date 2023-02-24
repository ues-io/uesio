package meta

import (
	"strconv"
)

type PaymentCollection []*Payment

var PAYMENT_COLLECTION_NAME = "uesio/studio.payment"
var PAYMENT_FIELDS = StandardGetFields(&Payment{})

func (lc *PaymentCollection) GetName() string {
	return PAYMENT_COLLECTION_NAME
}

func (lc *PaymentCollection) GetFields() []string {
	return PAYMENT_FIELDS
}

func (lc *PaymentCollection) NewItem() Item {
	return &Payment{}
}

func (lc *PaymentCollection) AddItem(item Item) error {
	*lc = append(*lc, item.(*Payment))
	return nil
}

func (lc *PaymentCollection) Loop(iter GroupIterator) error {
	for index, l := range *lc {
		err := iter(l, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (lc *PaymentCollection) Len() int {
	return len(*lc)
}

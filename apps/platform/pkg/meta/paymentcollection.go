package meta

import (
	"strconv"
)

type PaymentCollection []*Payment

func (lc *PaymentCollection) GetName() string {
	return "uesio/studio.payment"
}

func (lc *PaymentCollection) GetFields() []string {
	return StandardGetFields(&Payment{})
}

func (lc *PaymentCollection) GetItem(index int) Item {
	return (*lc)[index]
}

func (lc *PaymentCollection) NewItem() Item {
	return &Payment{}
}

func (lc *PaymentCollection) AddItem(item Item) {
	*lc = append(*lc, item.(*Payment))
}

func (lc *PaymentCollection) Loop(iter GroupIterator) error {
	for index := range *lc {
		err := iter(lc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (lc *PaymentCollection) Len() int {
	return len(*lc)
}

func (lc *PaymentCollection) GetItems() interface{} {
	return *lc
}

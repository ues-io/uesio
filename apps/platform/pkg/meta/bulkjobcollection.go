package meta

import (
	"strconv"
)

type BulkJobCollection []*BulkJob

func (bjc *BulkJobCollection) GetName() string {
	return "uesio/core.bulkjob"
}

func (bjc *BulkJobCollection) GetFields() []string {
	return StandardGetFields(&BulkJob{})
}

func (bjc *BulkJobCollection) GetItem(index int) Item {
	return (*bjc)[index]
}

func (bjc *BulkJobCollection) NewItem() Item {
	return &BulkJob{}
}

func (bjc *BulkJobCollection) AddItem(item Item) {
	*bjc = append(*bjc, item.(*BulkJob))
}

func (bjc *BulkJobCollection) Loop(iter GroupIterator) error {
	for index := range *bjc {
		err := iter(bjc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (bjc *BulkJobCollection) Len() int {
	return len(*bjc)
}

func (bjc *BulkJobCollection) GetItems() interface{} {
	return *bjc
}

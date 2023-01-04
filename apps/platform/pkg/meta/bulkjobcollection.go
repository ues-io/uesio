package meta

import (
	"strconv"
)

type BulkJobCollection []*BulkJob

var BULKJOB_COLLECTION_NAME = "uesio/core.bulkjob"
var BULKJOB_FIELDS = StandardGetFields(&BulkJob{})

func (bjc *BulkJobCollection) GetName() string {
	return BULKJOB_COLLECTION_NAME
}

func (bjc *BulkJobCollection) GetFields() []string {
	return BULKJOB_FIELDS
}

func (bjc *BulkJobCollection) NewItem() Item {
	return &BulkJob{}
}

func (bjc *BulkJobCollection) AddItem(item Item) {
	*bjc = append(*bjc, item.(*BulkJob))
}

func (bjc *BulkJobCollection) Loop(iter GroupIterator) error {
	for index, bj := range *bjc {
		err := iter(bj, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (bjc *BulkJobCollection) Len() int {
	return len(*bjc)
}

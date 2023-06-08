package meta

import (
	"strconv"
)

type BulkBatchCollection []*BulkBatch

var BULKBATCH_COLLECTION_NAME = "uesio/core.bulkbatch"
var BULKBATCH_FIELDS = StandardGetFields(&BulkBatch{})

func (bbc *BulkBatchCollection) GetName() string {
	return BULKBATCH_COLLECTION_NAME
}

func (bbc *BulkBatchCollection) GetFields() []string {
	return BULKBATCH_FIELDS
}

func (bbc *BulkBatchCollection) NewItem() Item {
	return &BulkBatch{}
}

func (bbc *BulkBatchCollection) AddItem(item Item) error {
	*bbc = append(*bbc, item.(*BulkBatch))
	return nil
}

func (bbc *BulkBatchCollection) Loop(iter GroupIterator) error {
	for index, bb := range *bbc {
		err := iter(bb, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (bbc *BulkBatchCollection) Len() int {
	return len(*bbc)
}

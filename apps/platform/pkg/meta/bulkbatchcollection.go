package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// BulkBatchCollection slice
type BulkBatchCollection []BulkBatch

// GetName function
func (bbc *BulkBatchCollection) GetName() string {
	return "uesio.bulkbatches"
}

// GetFields function
func (bbc *BulkBatchCollection) GetFields() []string {
	return StandardGetFields(&BulkBatch{})
}

// GetItem function
func (bbc *BulkBatchCollection) GetItem(index int) loadable.Item {
	return &(*bbc)[index]
}

// NewItem function
func (bbc *BulkBatchCollection) NewItem() loadable.Item {
	*bbc = append(*bbc, BulkBatch{})
	return &(*bbc)[len(*bbc)-1]
}

// Loop function
func (bbc *BulkBatchCollection) Loop(iter func(item loadable.Item) error) error {
	for index := range *bbc {
		err := iter(bbc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (bbc *BulkBatchCollection) Len() int {
	return len(*bbc)
}

// GetItems function
func (bbc *BulkBatchCollection) GetItems() interface{} {
	return *bbc
}

// Slice function
func (bbc *BulkBatchCollection) Slice(start int, end int) {

}

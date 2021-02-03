package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// BulkBatchCollection slice
type BulkBatchCollection []BulkBatch

// GetName function
func (bbc *BulkBatchCollection) GetName() string {
	return "bulkbatches"
}

// GetFields function
func (bbc *BulkBatchCollection) GetFields() []string {
	return StandardGetFields(&BulkBatch{})
}

// GetItem function
func (bbc *BulkBatchCollection) GetItem(index int) loadable.Item {
	return &(*bbc)[index]
}

// AddItem function
func (bbc *BulkBatchCollection) AddItem(item loadable.Item) {
	*bbc = append(*bbc, *item.(*BulkBatch))
}

// NewItem function
func (bbc *BulkBatchCollection) NewItem() loadable.Item {
	return &BulkBatch{}
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
	return bbc
}

// Slice function
func (bbc *BulkBatchCollection) Slice(start int, end int) {

}

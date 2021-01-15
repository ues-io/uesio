package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// BulkBatchCollection slice
type BulkBatchCollection []BulkBatch

// GetName function
func (bbc *BulkBatchCollection) GetName() string {
	return "bulkbatches"
}

// GetFields function
func (bbc *BulkBatchCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(bbc)
}

// GetItem function
func (bbc *BulkBatchCollection) GetItem(index int) adapters.LoadableItem {
	actual := *bbc
	return &actual[index]
}

// AddItem function
func (bbc *BulkBatchCollection) AddItem(item adapters.LoadableItem) {
	*bbc = append(*bbc, *item.(*BulkBatch))
}

// NewItem function
func (bbc *BulkBatchCollection) NewItem() adapters.LoadableItem {
	return &BulkBatch{}
}

// Loop function
func (bbc *BulkBatchCollection) Loop(iter func(item adapters.LoadableItem) error) error {
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

package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// BulkBatchCollection slice
type BulkBatchCollection []BulkBatch

// GetName function
func (bbc *BulkBatchCollection) GetName() string {
	return "bulkbatches"
}

// GetFields function
func (bbc *BulkBatchCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(bbc)
}

// GetItem function
func (bbc *BulkBatchCollection) GetItem(index int) LoadableItem {
	actual := *bbc
	return &actual[index]
}

// AddItem function
func (bbc *BulkBatchCollection) AddItem(item LoadableItem) {
	*bbc = append(*bbc, *item.(*BulkBatch))
}

// NewItem function
func (bbc *BulkBatchCollection) NewItem() LoadableItem {
	return &BulkBatch{}
}

// Loop function
func (bbc *BulkBatchCollection) Loop(iter func(item LoadableItem) error) error {
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

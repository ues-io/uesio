package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// BulkJobCollection slice
type BulkJobCollection []BulkJob

// GetName function
func (bjc *BulkJobCollection) GetName() string {
	return "bulkjobs"
}

// GetFields function
func (bjc *BulkJobCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(bjc)
}

// GetItem function
func (bjc *BulkJobCollection) GetItem(index int) adapters.LoadableItem {
	return &(*bjc)[index]
}

// AddItem function
func (bjc *BulkJobCollection) AddItem(item adapters.LoadableItem) {
	*bjc = append(*bjc, *item.(*BulkJob))
}

// NewItem function
func (bjc *BulkJobCollection) NewItem() adapters.LoadableItem {
	return &BulkJob{}
}

// Loop function
func (bjc *BulkJobCollection) Loop(iter func(item adapters.LoadableItem) error) error {
	for index := range *bjc {
		err := iter(bjc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (bjc *BulkJobCollection) Len() int {
	return len(*bjc)
}

// GetItems function
func (bjc *BulkJobCollection) GetItems() interface{} {
	return bjc
}

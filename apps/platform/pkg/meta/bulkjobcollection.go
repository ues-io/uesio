package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// BulkJobCollection slice
type BulkJobCollection []BulkJob

// GetName function
func (bjc *BulkJobCollection) GetName() string {
	return "uesio/uesio.bulkjobs"
}

// GetFields function
func (bjc *BulkJobCollection) GetFields() []string {
	return StandardGetFields(&BulkJob{})
}

// GetItem function
func (bjc *BulkJobCollection) GetItem(index int) loadable.Item {
	return &(*bjc)[index]
}

// NewItem function
func (bjc *BulkJobCollection) NewItem() loadable.Item {
	*bjc = append(*bjc, BulkJob{})
	return &(*bjc)[len(*bjc)-1]
}

// Loop function
func (bjc *BulkJobCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *bjc {
		err := iter(bjc.GetItem(index), strconv.Itoa(index))
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
	return *bjc
}

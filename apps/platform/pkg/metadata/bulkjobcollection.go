package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// BulkJobCollection slice
type BulkJobCollection []BulkJob

// GetName function
func (bjc *BulkJobCollection) GetName() string {
	return "bulkjobs"
}

// GetFields function
func (bjc *BulkJobCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(bjc)
}

// GetItem function
func (bjc *BulkJobCollection) GetItem(index int) LoadableItem {
	actual := *bjc
	return &actual[index]
}

// AddItem function
func (bjc *BulkJobCollection) AddItem(item LoadableItem) {
	*bjc = append(*bjc, *item.(*BulkJob))
}

// NewItem function
func (bjc *BulkJobCollection) NewItem() LoadableItem {
	return &BulkJob{}
}

// Loop function
func (bjc *BulkJobCollection) Loop(iter func(item LoadableItem) error) error {
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

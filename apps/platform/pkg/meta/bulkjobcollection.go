package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type BulkJobCollection []*BulkJob

func (bjc *BulkJobCollection) GetName() string {
	return "uesio/core.bulkjob"
}

func (bjc *BulkJobCollection) GetFields() []string {
	return StandardGetFields(&BulkJob{})
}

func (bjc *BulkJobCollection) GetItem(index int) loadable.Item {
	return (*bjc)[index]
}

func (bjc *BulkJobCollection) NewItem() loadable.Item {
	bj := &BulkJob{}
	*bjc = append(*bjc, bj)
	return bj
}

func (bjc *BulkJobCollection) Loop(iter loadable.GroupIterator) error {
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

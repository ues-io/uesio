package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type BulkBatchCollection []*BulkBatch

func (bbc *BulkBatchCollection) GetName() string {
	return "uesio/core.bulkbatch"
}

func (bbc *BulkBatchCollection) GetFields() []string {
	return StandardGetFields(&BulkBatch{})
}

func (bbc *BulkBatchCollection) GetItem(index int) loadable.Item {
	return (*bbc)[index]
}

func (bbc *BulkBatchCollection) NewItem() loadable.Item {
	*bbc = append(*bbc, &BulkBatch{})
	return (*bbc)[len(*bbc)-1]
}

func (bbc *BulkBatchCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *bbc {
		err := iter(bbc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (bbc *BulkBatchCollection) Len() int {
	return len(*bbc)
}

func (bbc *BulkBatchCollection) GetItems() interface{} {
	return *bbc
}

package meta

import (
	"strconv"
)

type UsageCollection []*Usage

var USAGE_COLLECTION_NAME = "uesio/studio.usage"
var USAGE_FIELDS = StandardGetFields(&Usage{})

func (lpic *UsageCollection) GetName() string {
	return USAGE_COLLECTION_NAME
}

func (lpic *UsageCollection) GetFields() []string {
	return USAGE_FIELDS
}

func (lpic *UsageCollection) NewItem() Item {
	return &Usage{}
}

func (lpic *UsageCollection) AddItem(item Item) error {
	*lpic = append(*lpic, item.(*Usage))
	return nil
}

func (lpic *UsageCollection) Loop(iter GroupIterator) error {
	for index, lpi := range *lpic {
		err := iter(lpi, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (lpic *UsageCollection) Len() int {
	return len(*lpic)
}

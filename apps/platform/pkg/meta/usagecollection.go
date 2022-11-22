package meta

import (
	"strconv"
)

type UsageCollection []*Usage

func (lpic *UsageCollection) GetName() string {
	return "uesio/studio.usage"
}

func (lpic *UsageCollection) GetFields() []string {
	return StandardGetFields(&Usage{})
}

func (lpic *UsageCollection) GetItem(index int) Item {
	return (*lpic)[index]
}

func (lpic *UsageCollection) NewItem() Item {
	return &Usage{}
}

func (lpic *UsageCollection) AddItem(item Item) {
	*lpic = append(*lpic, item.(*Usage))
}

func (lpic *UsageCollection) Loop(iter GroupIterator) error {
	for index := range *lpic {
		err := iter(lpic.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (lpic *UsageCollection) Len() int {
	return len(*lpic)
}

func (lpic *UsageCollection) GetItems() interface{} {
	return *lpic
}

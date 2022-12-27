package meta

import (
	"strconv"
)

type AppCollection []*App

var APP_COLLECTION_NAME = "uesio/studio.app"

func (ac *AppCollection) GetName() string {
	return APP_COLLECTION_NAME
}

func (ac *AppCollection) GetFields() []string {
	return StandardGetFields(&App{})
}

func (ac *AppCollection) GetItem(index int) Item {
	return (*ac)[index]
}

func (ac *AppCollection) NewItem() Item {
	return &App{}
}

func (ac *AppCollection) AddItem(item Item) {
	*ac = append(*ac, item.(*App))
}

func (ac *AppCollection) Loop(iter GroupIterator) error {
	for index := range *ac {
		err := iter(ac.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (ac *AppCollection) Len() int {
	return len(*ac)
}

func (ac *AppCollection) GetItems() interface{} {
	return *ac
}

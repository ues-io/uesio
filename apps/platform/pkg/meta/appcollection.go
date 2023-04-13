package meta

import (
	"strconv"
)

type AppCollection []*App

var APP_COLLECTION_NAME = "uesio/studio.app"
var APP_FIELDS = StandardGetFields(&App{})

func (ac *AppCollection) GetName() string {
	return APP_COLLECTION_NAME
}

func (ac *AppCollection) GetFields() []string {
	return APP_FIELDS
}

func (ac *AppCollection) NewItem() Item {
	return &App{}
}

func (ac *AppCollection) AddItem(item Item) error {
	*ac = append(*ac, item.(*App))
	return nil
}

func (ac *AppCollection) Loop(iter GroupIterator) error {
	for index, a := range *ac {
		err := iter(a, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (ac *AppCollection) Len() int {
	return len(*ac)
}

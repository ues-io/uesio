package meta

import (
	"strconv"
)

type SiteCollection []*Site

var SITE_COLLECTION_NAME = "uesio/studio.site"

func (sc *SiteCollection) GetName() string {
	return SITE_COLLECTION_NAME
}

func (sc *SiteCollection) GetFields() []string {
	return StandardGetFields(&Site{})
}

func (sc *SiteCollection) GetItem(index int) Item {
	return (*sc)[index]
}

func (sc *SiteCollection) NewItem() Item {
	return &Site{}
}

func (sc *SiteCollection) AddItem(item Item) {
	*sc = append(*sc, item.(*Site))
}

func (sc *SiteCollection) Loop(iter GroupIterator) error {
	for index := range *sc {
		err := iter(sc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (sc *SiteCollection) Len() int {
	return len(*sc)
}

func (sc *SiteCollection) GetItems() interface{} {
	return *sc
}

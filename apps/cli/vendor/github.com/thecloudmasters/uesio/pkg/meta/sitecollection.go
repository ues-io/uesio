package meta

import (
	"strconv"
)

type SiteCollection []*Site

var SITE_COLLECTION_NAME = "uesio/studio.site"
var SITE_FIELDS = StandardGetFields(&Site{})

func (sc *SiteCollection) GetName() string {
	return SITE_COLLECTION_NAME
}

func (sc *SiteCollection) GetFields() []string {
	return SITE_FIELDS
}

func (sc *SiteCollection) NewItem() Item {
	return &Site{}
}

func (sc *SiteCollection) AddItem(item Item) error {
	*sc = append(*sc, item.(*Site))
	return nil
}

func (sc *SiteCollection) Loop(iter GroupIterator) error {
	for index, s := range *sc {
		err := iter(s, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (sc *SiteCollection) Len() int {
	return len(*sc)
}

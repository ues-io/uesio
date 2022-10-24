package meta

import (
	"strconv"
)

type SiteCollection []*Site

func (sc *SiteCollection) GetName() string {
	return "uesio/studio.site"
}

func (sc *SiteCollection) GetFields() []string {
	return StandardGetFields(&Site{})
}

func (sc *SiteCollection) GetItem(index int) Item {
	return (*sc)[index]
}

func (sc *SiteCollection) NewItem() Item {
	s := &Site{}
	*sc = append(*sc, s)
	return s
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

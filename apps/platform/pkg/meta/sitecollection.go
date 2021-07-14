package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// SiteCollection slice
type SiteCollection []Site

func (sc *SiteCollection) Filter(iter func(item loadable.Item) (bool, error)) error {
	return nil
}

// GetName function
func (sc *SiteCollection) GetName() string {
	return "uesio.sites"
}

// GetFields function
func (sc *SiteCollection) GetFields() []string {
	return StandardGetFields(&Site{})
}

// GetItem function
func (sc *SiteCollection) GetItem(index int) loadable.Item {
	return &(*sc)[index]
}

// NewItem function
func (sc *SiteCollection) NewItem() loadable.Item {
	*sc = append(*sc, Site{})
	return &(*sc)[len(*sc)-1]
}

// Loop function
func (sc *SiteCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *sc {
		err := iter(sc.GetItem(index), index)
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (sc *SiteCollection) Len() int {
	return len(*sc)
}

// GetItems function
func (sc *SiteCollection) GetItems() interface{} {
	return *sc
}

// Slice function
func (sc *SiteCollection) Slice(start int, end int) {

}

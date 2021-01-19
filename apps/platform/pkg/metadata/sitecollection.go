package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// SiteCollection slice
type SiteCollection []Site

// GetName function
func (sc *SiteCollection) GetName() string {
	return "sites"
}

// GetFields function
func (sc *SiteCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(sc)
}

// GetItem function
func (sc *SiteCollection) GetItem(index int) adapters.LoadableItem {
	return &(*sc)[index]
}

// AddItem function
func (sc *SiteCollection) AddItem(item adapters.LoadableItem) {
	*sc = append(*sc, *item.(*Site))
}

// NewItem function
func (sc *SiteCollection) NewItem() adapters.LoadableItem {
	return &Site{}
}

// Loop function
func (sc *SiteCollection) Loop(iter func(item adapters.LoadableItem) error) error {
	for index := range *sc {
		err := iter(sc.GetItem(index))
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
	return sc
}

// Slice function
func (sc *SiteCollection) Slice(start int, end int) error {
	return nil
}

package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// SiteCollection slice
type SiteCollection []Site

// GetName function
func (sc *SiteCollection) GetName() string {
	return "sites"
}

// GetFields function
func (sc *SiteCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(sc)
}

// GetItem function
func (sc *SiteCollection) GetItem(index int) LoadableItem {
	actual := *sc
	return &actual[index]
}

// AddItem function
func (sc *SiteCollection) AddItem(item LoadableItem) {
	*sc = append(*sc, *item.(*Site))
}

// NewItem function
func (sc *SiteCollection) NewItem() LoadableItem {
	return &Site{}
}

// Loop function
func (sc *SiteCollection) Loop(iter func(item LoadableItem) error) error {
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

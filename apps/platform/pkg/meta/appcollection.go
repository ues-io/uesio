package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// AppCollection slice
type AppCollection []App

// GetName function
func (ac *AppCollection) GetName() string {
	return "uesio.apps"
}

// GetFields function
func (ac *AppCollection) GetFields() []string {
	return StandardGetFields(&App{})
}

// GetItem function
func (ac *AppCollection) GetItem(index int) loadable.Item {
	return &(*ac)[index]
}

// NewItem function
func (ac *AppCollection) NewItem() loadable.Item {
	*ac = append(*ac, App{})
	return &(*ac)[len(*ac)-1]
}

// Loop function
func (ac *AppCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *ac {
		err := iter(ac.GetItem(index), index)
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (ac *AppCollection) Len() int {
	return len(*ac)
}

// GetItems function
func (ac *AppCollection) GetItems() interface{} {
	return *ac
}

// Slice function
func (ac *AppCollection) Slice(start int, end int) {

}
func (ac *AppCollection) Filter(iter func(item loadable.Item) (bool, error)) error {
	return nil
}

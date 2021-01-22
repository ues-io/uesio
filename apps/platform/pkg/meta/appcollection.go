package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// AppCollection slice
type AppCollection []App

// GetName function
func (ac *AppCollection) GetName() string {
	return "apps"
}

// GetFields function
func (ac *AppCollection) GetFields() []string {
	return StandardGetFields(ac)
}

// GetItem function
func (ac *AppCollection) GetItem(index int) loadable.Item {
	return &(*ac)[index]
}

// AddItem function
func (ac *AppCollection) AddItem(item loadable.Item) {
	*ac = append(*ac, *item.(*App))
}

// NewItem function
func (ac *AppCollection) NewItem() loadable.Item {
	return &App{}
}

// Loop function
func (ac *AppCollection) Loop(iter func(item loadable.Item) error) error {
	for index := range *ac {
		err := iter(ac.GetItem(index))
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
	return ac
}

// Slice function
func (ac *AppCollection) Slice(start int, end int) {

}

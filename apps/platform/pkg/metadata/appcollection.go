package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// AppCollection slice
type AppCollection []App

// GetName function
func (ac *AppCollection) GetName() string {
	return "apps"
}

// GetFields function
func (ac *AppCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(ac)
}

// GetItem function
func (ac *AppCollection) GetItem(index int) adapters.LoadableItem {
	actual := *ac
	return &actual[index]
}

// AddItem function
func (ac *AppCollection) AddItem(item adapters.LoadableItem) {
	*ac = append(*ac, *item.(*App))
}

// NewItem function
func (ac *AppCollection) NewItem() adapters.LoadableItem {
	return &App{}
}

// Loop function
func (ac *AppCollection) Loop(iter func(item adapters.LoadableItem) error) error {
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

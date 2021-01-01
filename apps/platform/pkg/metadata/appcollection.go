package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// AppCollection slice
type AppCollection []App

// GetName function
func (ac *AppCollection) GetName() string {
	return "apps"
}

// GetFields function
func (ac *AppCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(ac)
}

// GetItem function
func (ac *AppCollection) GetItem(index int) LoadableItem {
	actual := *ac
	return &actual[index]
}

// AddItem function
func (ac *AppCollection) AddItem(item LoadableItem) {
	*ac = append(*ac, *item.(*App))
}

// NewItem function
func (ac *AppCollection) NewItem() LoadableItem {
	return &App{}
}

// Loop function
func (ac *AppCollection) Loop(iter func(item LoadableItem) error) error {
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

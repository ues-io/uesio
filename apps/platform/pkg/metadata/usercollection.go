package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// UserCollection slice
type UserCollection []User

// GetName function
func (uc *UserCollection) GetName() string {
	return "users"
}

// GetFields function
func (uc *UserCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(uc)
}

// GetItem function
func (uc *UserCollection) GetItem(index int) LoadableItem {
	actual := *uc
	return &actual[index]
}

// AddItem function
func (uc *UserCollection) AddItem(item LoadableItem) {
	*uc = append(*uc, *item.(*User))
}

// NewItem function
func (uc *UserCollection) NewItem() LoadableItem {
	return &User{}
}

// Loop function
func (uc *UserCollection) Loop(iter func(item LoadableItem) error) error {
	for index := range *uc {
		err := iter(uc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (uc *UserCollection) Len() int {
	return len(*uc)
}

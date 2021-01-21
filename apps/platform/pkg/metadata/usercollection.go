package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/metadata/loadable"
)

// UserCollection slice
type UserCollection []User

// GetName function
func (uc *UserCollection) GetName() string {
	return "users"
}

// GetFields function
func (uc *UserCollection) GetFields() []string {
	return StandardGetFields(uc)
}

// GetItem function
func (uc *UserCollection) GetItem(index int) loadable.Item {
	return &(*uc)[index]
}

// AddItem function
func (uc *UserCollection) AddItem(item loadable.Item) {
	*uc = append(*uc, *item.(*User))
}

// NewItem function
func (uc *UserCollection) NewItem() loadable.Item {
	return &User{}
}

// Loop function
func (uc *UserCollection) Loop(iter func(item loadable.Item) error) error {
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

// GetItems function
func (uc *UserCollection) GetItems() interface{} {
	return uc
}

// Slice function
func (uc *UserCollection) Slice(start int, end int) {

}

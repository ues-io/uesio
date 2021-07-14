package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// UserCollection slice
type UserCollection []User

func (uc *UserCollection) Filter(iter func(item loadable.Item) (bool, error)) error {
	return nil
}

// GetName function
func (uc *UserCollection) GetName() string {
	return "uesio.users"
}

// GetFields function
func (uc *UserCollection) GetFields() []string {
	return StandardGetFields(&User{})
}

// GetItem function
func (uc *UserCollection) GetItem(index int) loadable.Item {
	return &(*uc)[index]
}

// NewItem function
func (uc *UserCollection) NewItem() loadable.Item {
	*uc = append(*uc, User{})
	return &(*uc)[len(*uc)-1]
}

// Loop function
func (uc *UserCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *uc {
		err := iter(uc.GetItem(index), index)
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
	return *uc
}

// Slice function
func (uc *UserCollection) Slice(start int, end int) {

}

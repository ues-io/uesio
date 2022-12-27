package meta

import (
	"strconv"
)

type UserCollection []*User

var USER_COLLECTION_NAME = "uesio/core.user"

func (uc *UserCollection) GetName() string {
	return USER_COLLECTION_NAME
}

func (uc *UserCollection) GetFields() []string {
	return StandardGetFields(&User{})
}

func (uc *UserCollection) GetItem(index int) Item {
	return (*uc)[index]
}

func (uc *UserCollection) NewItem() Item {
	return &User{}
}

func (uc *UserCollection) AddItem(item Item) {
	*uc = append(*uc, item.(*User))
}

func (uc *UserCollection) Loop(iter GroupIterator) error {
	for index := range *uc {
		err := iter(uc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (uc *UserCollection) Len() int {
	return len(*uc)
}

func (uc *UserCollection) GetItems() interface{} {
	return *uc
}

package meta

import (
	"strconv"
)

type UserCollection []*User

var USER_COLLECTION_NAME = "uesio/core.user"
var USER_FIELDS = StandardGetFields(&User{})

func (uc *UserCollection) GetName() string {
	return USER_COLLECTION_NAME
}

func (uc *UserCollection) GetFields() []string {
	return USER_FIELDS
}

func (uc *UserCollection) NewItem() Item {
	return &User{}
}

func (uc *UserCollection) AddItem(item Item) {
	*uc = append(*uc, item.(*User))
}

func (uc *UserCollection) Loop(iter GroupIterator) error {
	for index, u := range *uc {
		err := iter(u, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (uc *UserCollection) Len() int {
	return len(*uc)
}

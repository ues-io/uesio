package meta

import (
	"strconv"
)

type UserCollection []User

func (uc *UserCollection) GetName() string {
	return "uesio/core.user"
}

func (uc *UserCollection) GetFields() []string {
	return StandardGetFields(&User{})
}

func (uc *UserCollection) GetItem(index int) Item {
	return &(*uc)[index]
}

func (uc *UserCollection) NewItem() Item {
	*uc = append(*uc, User{})
	return &(*uc)[len(*uc)-1]
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

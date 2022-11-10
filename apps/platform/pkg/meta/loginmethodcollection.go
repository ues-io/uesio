package meta

import (
	"strconv"
)

type LoginMethodCollection []*LoginMethod

func (lmc *LoginMethodCollection) GetName() string {
	return "uesio/core.loginmethod"
}

func (lmc *LoginMethodCollection) GetFields() []string {
	return StandardGetFields(&LoginMethod{})
}

func (lmc *LoginMethodCollection) GetItem(index int) Item {
	return (*lmc)[index]
}

func (lmc *LoginMethodCollection) NewItem() Item {
	return &LoginMethod{}
}

func (lmc *LoginMethodCollection) AddItem(item Item) {
	*lmc = append(*lmc, item.(*LoginMethod))
}

func (lmc *LoginMethodCollection) Loop(iter GroupIterator) error {
	for index := range *lmc {
		err := iter(lmc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (lmc *LoginMethodCollection) Len() int {
	return len(*lmc)
}

func (lmc *LoginMethodCollection) GetItems() interface{} {
	return *lmc
}

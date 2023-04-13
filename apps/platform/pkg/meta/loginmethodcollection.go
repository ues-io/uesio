package meta

import (
	"strconv"
)

type LoginMethodCollection []*LoginMethod

var LOGINMETHOD_COLLECTION_NAME = "uesio/core.loginmethod"
var LOGINMETHOD_FIELDS = StandardGetFields(&LoginMethod{})

func (lmc *LoginMethodCollection) GetName() string {
	return LOGINMETHOD_COLLECTION_NAME
}

func (lmc *LoginMethodCollection) GetFields() []string {
	return LOGINMETHOD_FIELDS
}

func (lmc *LoginMethodCollection) NewItem() Item {
	return &LoginMethod{}
}

func (lmc *LoginMethodCollection) AddItem(item Item) error {
	*lmc = append(*lmc, item.(*LoginMethod))
	return nil
}

func (lmc *LoginMethodCollection) Loop(iter GroupIterator) error {
	for index, lm := range *lmc {
		err := iter(lm, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (lmc *LoginMethodCollection) Len() int {
	return len(*lmc)
}

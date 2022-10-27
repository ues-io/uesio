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
	lm := &LoginMethod{}
	*lmc = append(*lmc, lm)
	return lm
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

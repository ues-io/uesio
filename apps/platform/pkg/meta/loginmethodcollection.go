package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type LoginMethodCollection []*LoginMethod

func (lmc *LoginMethodCollection) GetName() string {
	return "uesio/core.loginmethod"
}

func (lmc *LoginMethodCollection) GetFields() []string {
	return StandardGetFields(&LoginMethod{})
}

func (lmc *LoginMethodCollection) GetItem(index int) loadable.Item {
	return (*lmc)[index]
}

func (lmc *LoginMethodCollection) NewItem() loadable.Item {
	lm := &LoginMethod{}
	*lmc = append(*lmc, lm)
	return lm
}

func (lmc *LoginMethodCollection) Loop(iter loadable.GroupIterator) error {
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

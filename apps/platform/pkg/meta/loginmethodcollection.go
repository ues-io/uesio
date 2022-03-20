package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type LoginMethodCollection []LoginMethod

// GetName function
func (lmc *LoginMethodCollection) GetName() string {
	return "uesio/core.loginmethod"
}

// GetFields function
func (lmc *LoginMethodCollection) GetFields() []string {
	return StandardGetFields(&LoginMethod{})
}

// GetItem function
func (lmc *LoginMethodCollection) GetItem(index int) loadable.Item {
	return &(*lmc)[index]
}

// NewItem function
func (lmc *LoginMethodCollection) NewItem() loadable.Item {
	*lmc = append(*lmc, LoginMethod{})
	return &(*lmc)[len(*lmc)-1]
}

// Loop function
func (lmc *LoginMethodCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *lmc {
		err := iter(lmc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (lmc *LoginMethodCollection) Len() int {
	return len(*lmc)
}

// GetItems function
func (lmc *LoginMethodCollection) GetItems() interface{} {
	return *lmc
}

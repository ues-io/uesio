package meta

import (
	"strconv"
)

type ConfigStoreValueCollection []*ConfigStoreValue

func (cc *ConfigStoreValueCollection) GetName() string {
	return "uesio/core.configstorevalue"
}

func (cc *ConfigStoreValueCollection) GetFields() []string {
	return StandardGetFields(&ConfigStoreValue{})
}

func (cc *ConfigStoreValueCollection) GetItem(index int) Item {
	return (*cc)[index]
}

func (cc *ConfigStoreValueCollection) NewItem() Item {
	c := &ConfigStoreValue{}
	*cc = append(*cc, c)
	return c
}

func (cc *ConfigStoreValueCollection) Loop(iter GroupIterator) error {
	for index := range *cc {
		err := iter(cc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (cc *ConfigStoreValueCollection) Len() int {
	return len(*cc)
}

func (cc *ConfigStoreValueCollection) GetItems() interface{} {
	return *cc
}

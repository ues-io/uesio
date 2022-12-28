package meta

import (
	"strconv"
)

type ConfigStoreValueCollection []*ConfigStoreValue

var CONFIGSTOREVALUE_COLLECTION_NAME = "uesio/core.configstorevalue"
var CONFIGSTOREVALUE_FIELDS = StandardGetFields(&ConfigStoreValue{})

func (cc *ConfigStoreValueCollection) GetName() string {
	return CONFIGSTOREVALUE_COLLECTION_NAME
}

func (cc *ConfigStoreValueCollection) GetFields() []string {
	return CONFIGSTOREVALUE_FIELDS
}

func (cc *ConfigStoreValueCollection) GetItem(index int) Item {
	return (*cc)[index]
}

func (cc *ConfigStoreValueCollection) NewItem() Item {
	return &ConfigStoreValue{}
}

func (cc *ConfigStoreValueCollection) AddItem(item Item) {
	*cc = append(*cc, item.(*ConfigStoreValue))
}

func (cc *ConfigStoreValueCollection) Loop(iter GroupIterator) error {
	for index, c := range *cc {
		err := iter(c, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (cc *ConfigStoreValueCollection) Len() int {
	return len(*cc)
}

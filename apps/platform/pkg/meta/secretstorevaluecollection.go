package meta

import (
	"strconv"
)

type SecretStoreValueCollection []*SecretStoreValue

var SECRETSTOREVALUE_COLLECTION_NAME = "uesio/core.secretstorevalue"

func (sc *SecretStoreValueCollection) GetName() string {
	return SECRETSTOREVALUE_COLLECTION_NAME
}

func (sc *SecretStoreValueCollection) GetFields() []string {
	return StandardGetFields(&SecretStoreValue{})
}

func (sc *SecretStoreValueCollection) GetItem(index int) Item {
	return (*sc)[index]
}

func (sc *SecretStoreValueCollection) NewItem() Item {
	return &SecretStoreValue{}
}

func (sc *SecretStoreValueCollection) AddItem(item Item) {
	*sc = append(*sc, item.(*SecretStoreValue))
}

func (sc *SecretStoreValueCollection) Loop(iter GroupIterator) error {
	for index := range *sc {
		err := iter(sc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (sc *SecretStoreValueCollection) Len() int {
	return len(*sc)
}

func (sc *SecretStoreValueCollection) GetItems() interface{} {
	return *sc
}

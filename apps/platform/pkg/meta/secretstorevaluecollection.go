package meta

import (
	"strconv"
)

type SecretStoreValueCollection []*SecretStoreValue

var SECRETSTOREVALUE_COLLECTION_NAME = "uesio/core.secretstorevalue"
var SECRETSTOREVALUE_FIELDS = StandardGetFields(&SecretStoreValue{})

func (sc *SecretStoreValueCollection) GetName() string {
	return SECRETSTOREVALUE_COLLECTION_NAME
}

func (sc *SecretStoreValueCollection) GetFields() []string {
	return SECRETSTOREVALUE_FIELDS
}

func (sc *SecretStoreValueCollection) NewItem() Item {
	return &SecretStoreValue{}
}

func (sc *SecretStoreValueCollection) AddItem(item Item) {
	*sc = append(*sc, item.(*SecretStoreValue))
}

func (sc *SecretStoreValueCollection) Loop(iter GroupIterator) error {
	for index, s := range *sc {
		err := iter(s, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (sc *SecretStoreValueCollection) Len() int {
	return len(*sc)
}

package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type SecretStoreValueCollection []*SecretStoreValue

func (sc *SecretStoreValueCollection) GetName() string {
	return "uesio/core.secretstorevalue"
}

func (sc *SecretStoreValueCollection) GetFields() []string {
	return StandardGetFields(&SecretStoreValue{})
}

func (sc *SecretStoreValueCollection) GetItem(index int) loadable.Item {
	return (*sc)[index]
}

func (sc *SecretStoreValueCollection) NewItem() loadable.Item {
	s := &SecretStoreValue{}
	*sc = append(*sc, s)
	return s
}

func (sc *SecretStoreValueCollection) Loop(iter loadable.GroupIterator) error {
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

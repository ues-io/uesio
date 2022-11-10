package meta

import (
	"strconv"
)

type SecretCollection []*Secret

func (sc *SecretCollection) GetName() string {
	return "uesio/studio.secret"
}

func (sc *SecretCollection) GetBundleFolderName() string {
	return "secrets"
}

func (sc *SecretCollection) GetFields() []string {
	return StandardGetFields(&Secret{})
}

func (sc *SecretCollection) NewItem() Item {
	return &Secret{}
}

func (sc *SecretCollection) AddItem(item Item) {
	*sc = append(*sc, item.(*Secret))
}

func (sc *SecretCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewSecret(key)
}

func (sc *SecretCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

func (sc *SecretCollection) GetItem(index int) Item {
	return (*sc)[index]
}

func (sc *SecretCollection) Loop(iter GroupIterator) error {
	for index := range *sc {
		err := iter(sc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (sc *SecretCollection) Len() int {
	return len(*sc)
}

func (sc *SecretCollection) GetItems() interface{} {
	return *sc
}

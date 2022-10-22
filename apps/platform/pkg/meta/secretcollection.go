package meta

import (
	"errors"
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
	s := &Secret{}
	*sc = append(*sc, s)
	return s
}

func (sc *SecretCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Invalid Secret Key: " + key)
	}
	s := &Secret{
		Namespace: namespace,
		Name:      name,
	}
	*sc = append(*sc, s)
	return s, nil
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

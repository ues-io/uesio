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

func (sc *SecretCollection) GetItemFromPath(path string) BundleableItem {
	return &Secret{Name: StandardNameFromPath(path)}
}

func (sc *SecretCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
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

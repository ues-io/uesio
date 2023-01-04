package meta

import (
	"strconv"
)

type SecretCollection []*Secret

var SECRET_COLLECTION_NAME = "uesio/studio.secret"
var SECRET_FOLDER_NAME = "secrets"
var SECRET_FIELDS = StandardGetFields(&Secret{})

func (sc *SecretCollection) GetName() string {
	return SECRET_COLLECTION_NAME
}

func (sc *SecretCollection) GetBundleFolderName() string {
	return SECRET_FOLDER_NAME
}

func (sc *SecretCollection) GetFields() []string {
	return SECRET_FIELDS
}

func (sc *SecretCollection) NewItem() Item {
	return &Secret{}
}

func (sc *SecretCollection) AddItem(item Item) {
	*sc = append(*sc, item.(*Secret))
}

func (sc *SecretCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseSecret(namespace, StandardNameFromPath(path))
}

func (sc *SecretCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (sc *SecretCollection) Loop(iter GroupIterator) error {
	for index, s := range *sc {
		err := iter(s, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (sc *SecretCollection) Len() int {
	return len(*sc)
}

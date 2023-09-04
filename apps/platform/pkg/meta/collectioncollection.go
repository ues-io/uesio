package meta

import (
	"strconv"
)

type CollectionCollection []*Collection

var COLLECTION_COLLECTION_NAME = "uesio/studio.collection"
var COLLECTION_FOLDER_NAME = "collections"
var COLLECTION_FIELDS = StandardGetFields(&Collection{})

func (cc *CollectionCollection) GetName() string {
	return COLLECTION_COLLECTION_NAME
}

func (cc *CollectionCollection) GetBundleFolderName() string {
	return COLLECTION_FOLDER_NAME
}

func (cc *CollectionCollection) GetFields() []string {
	return COLLECTION_FIELDS
}

func (cc *CollectionCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseCollection(namespace, StandardNameFromPath(path))
}

func (cc *CollectionCollection) GetItemFromKey(key string) (BundleableItem, error) {
	return NewCollection(key)
}

func (cc *CollectionCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (cc *CollectionCollection) NewItem() Item {
	return &Collection{}
}

func (cc *CollectionCollection) AddItem(item Item) error {
	*cc = append(*cc, item.(*Collection))
	return nil
}

func (cc *CollectionCollection) Loop(iter GroupIterator) error {
	for index, c := range *cc {
		err := iter(c, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (cc *CollectionCollection) Len() int {
	return len(*cc)
}

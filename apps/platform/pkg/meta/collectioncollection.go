package meta

import (
	"strconv"
)

type CollectionCollection []*Collection

var COLLECTION_COLLECTION_NAME = "uesio/studio.collection"
var COLLECTION_FOLDER_NAME = "collections"

func (cc *CollectionCollection) GetName() string {
	return COLLECTION_COLLECTION_NAME
}

func (cc *CollectionCollection) GetBundleFolderName() string {
	return COLLECTION_FOLDER_NAME
}

func (cc *CollectionCollection) GetFields() []string {
	return StandardGetFields(&Collection{})
}

func (cc *CollectionCollection) GetItemFromPath(path string) BundleableItem {
	return &Collection{Name: StandardNameFromPath(path)}
}

func (cc *CollectionCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (cc *CollectionCollection) NewItem() Item {
	return &Collection{}
}

func (cc *CollectionCollection) AddItem(item Item) {
	*cc = append(*cc, item.(*Collection))
}

func (cc *CollectionCollection) GetItem(index int) Item {
	return (*cc)[index]
}

func (cc *CollectionCollection) Loop(iter GroupIterator) error {
	for index := range *cc {
		err := iter(cc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (cc *CollectionCollection) Len() int {
	return len(*cc)
}

func (cc *CollectionCollection) GetItems() interface{} {
	return *cc
}

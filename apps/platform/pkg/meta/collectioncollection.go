package meta

import (
	"strconv"
)

type CollectionCollection []*Collection

func (cc *CollectionCollection) GetName() string {
	return "uesio/studio.collection"
}

func (cc *CollectionCollection) GetBundleFolderName() string {
	return "collections"
}

func (cc *CollectionCollection) GetFields() []string {
	return StandardGetFields(&Collection{})
}

func (cc *CollectionCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewCollection(key)
}

func (cc *CollectionCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
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

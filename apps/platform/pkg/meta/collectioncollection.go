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
	collection, err := NewCollection(key)
	if err != nil {
		return nil, err
	}
	*cc = append(*cc, collection)
	return collection, nil
}

func (cc *CollectionCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

func (cc *CollectionCollection) NewItem() Item {
	collection := &Collection{}
	*cc = append(*cc, collection)
	return collection
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

package meta

import (
	"strconv"
)

type UserFileCollectionCollection []*UserFileCollection

func (ufcc *UserFileCollectionCollection) GetName() string {
	return "uesio/studio.filecollection"
}

func (ufcc *UserFileCollectionCollection) GetBundleFolderName() string {
	return "filecollections"
}

func (ufcc *UserFileCollectionCollection) GetFields() []string {
	return StandardGetFields(&UserFileCollection{})
}

func (ufcc *UserFileCollectionCollection) NewItem() Item {
	ufc := &UserFileCollection{}
	*ufcc = append(*ufcc, ufc)
	return ufc
}

func (ufcc *UserFileCollectionCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	ufc, err := NewUserFileCollection(key)
	if err != nil {
		return nil, err
	}
	*ufcc = append(*ufcc, ufc)
	return ufc, nil
}

func (ufcc *UserFileCollectionCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

func (ufcc *UserFileCollectionCollection) GetItem(index int) Item {
	return (*ufcc)[index]
}

func (ufcc *UserFileCollectionCollection) Loop(iter GroupIterator) error {
	for index := range *ufcc {
		err := iter(ufcc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (ufcc *UserFileCollectionCollection) Len() int {
	return len(*ufcc)
}

func (ufcc *UserFileCollectionCollection) GetItems() interface{} {
	return *ufcc
}

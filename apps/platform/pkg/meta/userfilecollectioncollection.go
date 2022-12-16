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
	return &UserFileCollection{}
}

func (ufcc *UserFileCollectionCollection) AddItem(item Item) {
	*ufcc = append(*ufcc, item.(*UserFileCollection))
}

func (ufcc *UserFileCollectionCollection) GetItemFromPath(path string) (BundleableItem, bool) {
	return &UserFileCollection{Name: StandardNameFromPath(path)}, true
}

func (ufcc *UserFileCollectionCollection) FilterPath(path string, conditions BundleConditions) bool {
	return StandardPathFilter(path)
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

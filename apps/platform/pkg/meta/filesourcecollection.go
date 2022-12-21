package meta

import (
	"strconv"
)

type FileSourceCollection []*FileSource

func (fsc *FileSourceCollection) GetName() string {
	return "uesio/studio.filesource"
}

func (fsc *FileSourceCollection) GetBundleFolderName() string {
	return "filesources"
}

func (fsc *FileSourceCollection) GetFields() []string {
	return StandardGetFields(&FileSource{})
}

func (fsc *FileSourceCollection) NewItem() Item {
	return &FileSource{}
}

func (fsc *FileSourceCollection) AddItem(item Item) {
	*fsc = append(*fsc, item.(*FileSource))
}

func (fsc *FileSourceCollection) GetItemFromPath(path string) BundleableItem {
	return &FileSource{Name: StandardNameFromPath(path)}
}

func (fsc *FileSourceCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (fsc *FileSourceCollection) GetItem(index int) Item {
	return (*fsc)[index]
}

func (fsc *FileSourceCollection) Loop(iter GroupIterator) error {
	for index := range *fsc {
		err := iter(fsc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (fsc *FileSourceCollection) Len() int {
	return len(*fsc)
}

func (fsc *FileSourceCollection) GetItems() interface{} {
	return *fsc
}

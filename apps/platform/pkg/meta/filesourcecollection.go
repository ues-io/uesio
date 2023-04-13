package meta

import (
	"strconv"
)

type FileSourceCollection []*FileSource

var FILESOURCE_COLLECTION_NAME = "uesio/studio.filesource"
var FILESOURCE_FOLDER_NAME = "filesources"
var FILESOURCE_FIELDS = StandardGetFields(&FileSource{})

func (fsc *FileSourceCollection) GetName() string {
	return FILESOURCE_COLLECTION_NAME
}

func (fsc *FileSourceCollection) GetBundleFolderName() string {
	return FILESOURCE_FOLDER_NAME
}

func (fsc *FileSourceCollection) GetFields() []string {
	return FILESOURCE_FIELDS
}

func (fsc *FileSourceCollection) NewItem() Item {
	return &FileSource{}
}

func (fsc *FileSourceCollection) AddItem(item Item) error {
	*fsc = append(*fsc, item.(*FileSource))
	return nil
}

func (fsc *FileSourceCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseFileSource(namespace, StandardNameFromPath(path))
}

func (fsc *FileSourceCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (fsc *FileSourceCollection) Loop(iter GroupIterator) error {
	for index, fs := range *fsc {
		err := iter(fs, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (fsc *FileSourceCollection) Len() int {
	return len(*fsc)
}

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
	fs := &FileSource{}
	*fsc = append(*fsc, fs)
	return fs
}

func (fsc *FileSourceCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	fs, err := NewFileSource(key)
	if err != nil {
		return nil, err
	}
	*fsc = append(*fsc, fs)
	return fs, nil
}

func (fsc *FileSourceCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
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

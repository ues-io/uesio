package meta

import (
	"os"
	"strconv"
	"strings"
)

type FileCollection []*File

func (fc *FileCollection) GetName() string {
	return "uesio/studio.file"
}

func (fc *FileCollection) GetBundleFolderName() string {
	return "files"
}

func (fc *FileCollection) GetFields() []string {
	return StandardGetFields(&File{})
}

func (fc *FileCollection) NewItem() Item {
	return &File{}
}

func (fc *FileCollection) AddItem(item Item) {
	*fc = append(*fc, item.(*File))
}

func (fc *FileCollection) GetItemFromPath(path string) (BundleableItem, bool) {
	parts := strings.Split(path, string(os.PathSeparator))
	if len(parts) != 2 || parts[1] != "file.yaml" {
		// Ignore this file
		return nil, false
	}
	return &File{Name: parts[0]}, true
}

func (fc *FileCollection) FilterPath(path string, conditions BundleConditions) bool {
	return true
}

func (fc *FileCollection) GetItem(index int) Item {
	return (*fc)[index]
}

func (fc *FileCollection) Loop(iter GroupIterator) error {
	for index := range *fc {
		err := iter(fc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (fc *FileCollection) Len() int {
	return len(*fc)
}

func (fc *FileCollection) GetItems() interface{} {
	return *fc
}

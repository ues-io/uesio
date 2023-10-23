package meta

import (
	"strconv"
	"strings"
)

type FileCollection []*File

var FILE_COLLECTION_NAME = "uesio/studio.file"
var FILE_FOLDER_NAME = "files"
var FILE_FIELDS = StandardGetFields(&File{})

func (fc *FileCollection) GetName() string {
	return FILE_COLLECTION_NAME
}

func (fc *FileCollection) GetBundleFolderName() string {
	return FILE_FOLDER_NAME
}

func (fc *FileCollection) GetFields() []string {
	return FILE_FIELDS
}

func (fc *FileCollection) NewItem() Item {
	return &File{}
}

func (fc *FileCollection) AddItem(item Item) error {
	*fc = append(*fc, item.(*File))
	return nil
}

func (fc *FileCollection) GetItemFromPath(path, namespace string) BundleableItem {
	parts := strings.Split(path, "/")
	return NewBaseFile(namespace, parts[0])
}

func (fc *FileCollection) GetItemFromKey(key string) (BundleableItem, error) {
	return NewFile(key)
}

func (fc *FileCollection) IsDefinitionPath(path string) bool {
	parts := strings.Split(path, "/")
	return len(parts) == 2 && parts[1] == "file.yaml"
}

func (fc *FileCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	if definitionOnly {
		return fc.IsDefinitionPath(path)
	}
	return true
}

func (fc *FileCollection) Loop(iter GroupIterator) error {
	for index, f := range *fc {
		err := iter(f, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (fc *FileCollection) Len() int {
	return len(*fc)
}

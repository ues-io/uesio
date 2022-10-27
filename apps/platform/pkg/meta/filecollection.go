package meta

import (
	"errors"
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
	f := &File{}
	*fc = append(*fc, f)
	return f
}

func (fc *FileCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	f, err := NewFile(key)
	if err != nil {
		return nil, err
	}
	*fc = append(*fc, f)
	return f, nil
}

func (fc *FileCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	if len(conditions) > 0 {
		return "", errors.New("Conditions not allowed for files")
	}
	parts := strings.Split(path, string(os.PathSeparator))
	if len(parts) != 2 || parts[1] != "file.yaml" {
		// Ignore this file
		return "", nil
	}
	return namespace + "." + parts[0], nil
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

package meta

import (
	"errors"
	"os"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// FileCollection slice
type FileCollection []File

// GetName function
func (fc *FileCollection) GetName() string {
	return "studio.files"
}

// GetFields function
func (fc *FileCollection) GetFields() []string {
	return StandardGetFields(&File{})
}

// NewItem function
func (fc *FileCollection) NewItem() loadable.Item {
	*fc = append(*fc, File{})
	return &(*fc)[len(*fc)-1]
}

// NewBundleableItemWithKey function
func (fc *FileCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	f, err := NewFile(key)
	if err != nil {
		return nil, err
	}
	*fc = append(*fc, *f)
	return &(*fc)[len(*fc)-1], nil
}

// GetKeyFromPath function
func (fc *FileCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	if len(conditions) > 0 {
		return "", errors.New("Conditions not allowed for files")
	}
	parts := strings.Split(path, string(os.PathSeparator))
	if len(parts) != 2 || parts[1] != "file.yaml" {
		// Ignore this file
		return "", nil
	}
	return parts[0], nil
}

// GetItem function
func (fc *FileCollection) GetItem(index int) loadable.Item {
	return &(*fc)[index]
}

// Loop function
func (fc *FileCollection) Loop(iter func(item loadable.Item) error) error {
	for index := range *fc {
		err := iter(fc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (fc *FileCollection) Len() int {
	return len(*fc)
}

// GetItems function
func (fc *FileCollection) GetItems() interface{} {
	return *fc
}

// Slice function
func (fc *FileCollection) Slice(start int, end int) {

}

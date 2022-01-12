package meta

import (
	"errors"
	"os"
	"path/filepath"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// FieldCollection slice
type FieldCollection []Field

// GetName function
func (fc *FieldCollection) GetName() string {
	return "studio.fields"
}

// GetFields function
func (fc *FieldCollection) GetFields() []string {
	return StandardGetFields(&Field{})
}

// NewItem function
func (fc *FieldCollection) NewItem() loadable.Item {
	*fc = append(*fc, Field{})
	return &(*fc)[len(*fc)-1]
}

// NewBundleableItemWithKey function
func (fc *FieldCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, string(os.PathSeparator))
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid Field Key: " + key)
	}
	namespace, name, err := ParseKey(keyArray[1])
	if err != nil {
		return nil, errors.New("Invalid Field Key: " + key)
	}
	*fc = append(*fc, Field{
		CollectionRef: keyArray[0],
		Namespace:     namespace,
		Name:          name,
	})
	return &(*fc)[len(*fc)-1], nil
}

// GetKeyFromPath function
func (fc *FieldCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	collectionKey, hasCollection := conditions["studio.collection"]
	parts := strings.Split(path, string(os.PathSeparator))
	if len(parts) != 2 || !strings.HasSuffix(parts[1], ".yaml") {
		// Ignore this file
		return "", nil
	}
	if hasCollection {
		if parts[0] != collectionKey {
			return "", nil
		}
	}
	return filepath.Join(parts[0], strings.TrimSuffix(parts[1], ".yaml")), nil
}

// GetItem function
func (fc *FieldCollection) GetItem(index int) loadable.Item {
	return &(*fc)[index]
}

// Loop function
func (fc *FieldCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *fc {
		err := iter(fc.GetItem(index), index)
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (fc *FieldCollection) Len() int {
	return len(*fc)
}

// GetItems function
func (fc *FieldCollection) GetItems() interface{} {
	return *fc
}

// Slice function
func (fc *FieldCollection) Slice(start int, end int) {

}
func (fc *FieldCollection) Filter(iter func(item loadable.Item) (bool, error)) error {
	return nil
}

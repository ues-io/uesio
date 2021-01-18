package metadata

import (
	"errors"
	"os"
	"path/filepath"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// FieldCollection slice
type FieldCollection []Field

// GetName function
func (fc *FieldCollection) GetName() string {
	return "fields"
}

// GetFields function
func (fc *FieldCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(fc)
}

// NewItem function
func (fc *FieldCollection) NewItem() adapters.LoadableItem {
	return &Field{}
}

// NewBundleableItem function
func (fc *FieldCollection) NewBundleableItem() BundleableItem {
	return &Field{}
}

// NewBundleableItem function
func (fc *FieldCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, string(os.PathSeparator))
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid Field Key: " + key)
	}
	namespace, name, err := ParseKey(keyArray[1])
	if err != nil {
		return nil, errors.New("Invalid Field Key: " + key)
	}
	return &Field{
		CollectionRef: keyArray[0],
		Namespace:     namespace,
		Name:          name,
	}, nil
}

// GetKeyFromPath function
func (fc *FieldCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	collectionKey, hasCollection := conditions["uesio.collection"]
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

// AddItem function
func (fc *FieldCollection) AddItem(item adapters.LoadableItem) {
	*fc = append(*fc, *item.(*Field))
}

// GetItem function
func (fc *FieldCollection) GetItem(index int) adapters.LoadableItem {
	return &(*fc)[index]
}

// Loop function
func (fc *FieldCollection) Loop(iter func(item adapters.LoadableItem) error) error {
	for index := range *fc {
		err := iter(fc.GetItem(index))
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
	return fc
}

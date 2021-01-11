package metadata

import (
	"errors"
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
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 4 {
		return nil, errors.New("Invalid Field Key: " + key)
	}
	return &Field{
		CollectionRef: keyArray[0] + "." + keyArray[1],
		Namespace:     keyArray[2],
		Name:          keyArray[3],
	}, nil
}

// GetKeyPrefix function
func (fc *FieldCollection) GetKeyPrefix(conditions BundleConditions) string {
	collectionKey, hasCollection := conditions["uesio.collection"]
	if hasCollection {
		return collectionKey + "."
	}
	return ""
}

// AddItem function
func (fc *FieldCollection) AddItem(item adapters.LoadableItem) {
	*fc = append(*fc, *item.(*Field))
}

// GetItem function
func (fc *FieldCollection) GetItem(index int) adapters.LoadableItem {
	actual := *fc
	return &actual[index]
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

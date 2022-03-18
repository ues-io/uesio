package meta

import (
	"errors"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// FieldCollection slice
type FieldCollection []Field

// GetName function
func (fc *FieldCollection) GetName() string {
	return "uesio/studio.fields"
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
	if len(keyArray) != 4 {
		return nil, errors.New("Invalid Field Key: " + key)
	}
	namespace, name, err := ParseKey(keyArray[3])
	if err != nil {
		return nil, errors.New("Invalid Field Key: " + key)
	}
	*fc = append(*fc, Field{
		CollectionRef: keyArray[0] + "/" + keyArray[1],
		Namespace:     keyArray[2] + "/" + namespace,
		Name:          name,
	})
	return &(*fc)[len(*fc)-1], nil
}

// GetKeyFromPath function
func (fc *FieldCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	collectionKey, hasCollection := conditions["studio.collection"]
	parts := strings.Split(path, string(os.PathSeparator))
	if len(parts) != 4 || !strings.HasSuffix(parts[3], ".yaml") {
		// Ignore this file
		return "", nil
	}
	if hasCollection {

		collectionNS, collectionName, err := ParseKey(collectionKey)
		if err != nil {
			return "", err
		}
		nsUser, nsApp, err := ParseNamespace(collectionNS)
		if err != nil {
			return "", err
		}
		if parts[0] != nsUser || parts[1] != nsApp || parts[2] != collectionName {
			return "", nil
		}
	}
	return filepath.Join(parts[0], parts[1]+"."+parts[2], namespace+"."+strings.TrimSuffix(parts[3], ".yaml")), nil
}

// GetItem function
func (fc *FieldCollection) GetItem(index int) loadable.Item {
	return &(*fc)[index]
}

// Loop function
func (fc *FieldCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *fc {
		err := iter(fc.GetItem(index), strconv.Itoa(index))
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

package meta

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
)

type FieldCollection []*Field

func (fc *FieldCollection) GetName() string {
	return "uesio/studio.field"
}

func (fc *FieldCollection) GetBundleFolderName() string {
	return "fields"
}

func (fc *FieldCollection) GetFields() []string {
	return StandardGetFields(&Field{})
}

func (fc *FieldCollection) NewItem() Item {
	return &Field{}
}

func (fc *FieldCollection) AddItem(item Item) {
	*fc = append(*fc, item.(*Field))
}

func (fc *FieldCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ":")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid Field Key: " + key)
	}
	return NewField(keyArray[0], keyArray[1])
}

func (fc *FieldCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	collectionKey, hasCollection := conditions["uesio/studio.collection"]
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
	field := Field{
		CollectionRef: fmt.Sprintf("%s/%s.%s", parts[0], parts[1], parts[2]),
		Namespace:     namespace,
		Name:          strings.TrimSuffix(parts[3], ".yaml"),
	}
	return field.GetKey(), nil
}

func (fc *FieldCollection) GetItem(index int) Item {
	return (*fc)[index]
}

func (fc *FieldCollection) Loop(iter GroupIterator) error {
	for index := range *fc {
		err := iter(fc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (fc *FieldCollection) Len() int {
	return len(*fc)
}

func (fc *FieldCollection) GetItems() interface{} {
	return *fc
}

package meta

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
)

type FieldCollection []*Field

var FIELD_COLLECTION_NAME = "uesio/studio.field"
var FIELD_FOLDER_NAME = "fields"
var FIELD_FIELDS = StandardGetFields(&Field{})

func (fc *FieldCollection) GetName() string {
	return FIELD_COLLECTION_NAME
}

func (fc *FieldCollection) GetBundleFolderName() string {
	return FIELD_FOLDER_NAME
}

func (fc *FieldCollection) GetFields() []string {
	return FIELD_FIELDS
}

func (fc *FieldCollection) NewItem() Item {
	return &Field{}
}

func (fc *FieldCollection) AddItem(item Item) error {
	*fc = append(*fc, item.(*Field))
	return nil
}

func (fc *FieldCollection) GetItemFromPath(path, namespace string) BundleableItem {
	parts := strings.Split(path, "/")
	partLength := len(parts)
	if partLength != 4 {
		return nil
	}
	collectionKey := fmt.Sprintf("%s/%s.%s", parts[0], parts[1], parts[2])
	name := strings.TrimSuffix(parts[3], ".yaml")
	return NewBaseField(collectionKey, namespace, name)
}

func (fc *FieldCollection) GetItemFromKey(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ":")
	if (len(keyArray)) != 2 {
		return nil, errors.New("Invalid Field Key")
	}
	return NewField(keyArray[0], keyArray[1])
}

func (fc *FieldCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	collectionKey, hasCollection := conditions["uesio/studio.collection"]
	parts := strings.Split(path, "/")
	if len(parts) != 4 || !strings.HasSuffix(parts[3], ".yaml") {
		// Ignore this file
		return false
	}
	if hasCollection {
		collectionNS, collectionName, err := ParseKey(collectionKey)
		if err != nil {
			return false
		}
		nsUser, nsApp, err := ParseNamespace(collectionNS)
		if err != nil {
			return false
		}
		if parts[0] != nsUser || parts[1] != nsApp || parts[2] != collectionName {
			return false
		}
	}
	return true
}

func (fc *FieldCollection) Loop(iter GroupIterator) error {
	for index, f := range *fc {
		err := iter(f, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (fc *FieldCollection) Len() int {
	return len(*fc)
}

package meta

import (
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

func (fc *FieldCollection) GetItemFromPath(path string) (BundleableItem, bool) {
	parts := strings.Split(path, string(os.PathSeparator))
	return &Field{
		CollectionRef: fmt.Sprintf("%s/%s.%s", parts[0], parts[1], parts[2]),
		Name:          strings.TrimSuffix(parts[3], ".yaml"),
	}, true
}

func (fc *FieldCollection) FilterPath(path string, conditions BundleConditions) bool {
	collectionKey, hasCollection := conditions["uesio/studio.collection"]
	parts := strings.Split(path, string(os.PathSeparator))
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

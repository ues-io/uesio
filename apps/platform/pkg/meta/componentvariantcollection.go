package meta

import (
	"fmt"
	"strconv"
	"strings"
)

type ComponentVariantCollection []*ComponentVariant

var COMPONENTVARIANT_COLLECTION_NAME = "uesio/studio.componentvariant"
var COMPONENTVARIANT_FOLDER_NAME = "componentvariants"
var COMPONENTVARIANT_FIELDS = StandardGetFields(&ComponentVariant{})

func (cvc *ComponentVariantCollection) GetName() string {
	return COMPONENTVARIANT_COLLECTION_NAME
}

func (cvc *ComponentVariantCollection) GetBundleFolderName() string {
	return COMPONENTVARIANT_FOLDER_NAME
}

func (cvc *ComponentVariantCollection) GetFields() []string {
	return COMPONENTVARIANT_FIELDS
}

func (cvc *ComponentVariantCollection) NewItem() Item {
	return &ComponentVariant{}
}

func (cvc *ComponentVariantCollection) AddItem(item Item) error {
	*cvc = append(*cvc, item.(*ComponentVariant))
	return nil
}

func (cvc *ComponentVariantCollection) GetItemFromPath(path, namespace string) BundleableItem {
	parts := strings.Split(path, "/")
	componentKey := fmt.Sprintf("%s/%s.%s", parts[0], parts[1], parts[2])
	name := strings.TrimSuffix(parts[3], ".yaml")
	return NewBaseComponentVariant(componentKey, namespace, name)
}

func (cvc *ComponentVariantCollection) GetItemFromKey(key string) (BundleableItem, error) {
	return NewComponentVariant(key)
}

func (cvc *ComponentVariantCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return GroupedPathFilter(path, "uesio/studio.component", conditions)
}

func (cvc *ComponentVariantCollection) Loop(iter GroupIterator) error {
	for index, cv := range *cvc {
		err := iter(cv, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (cvc *ComponentVariantCollection) Len() int {
	return len(*cvc)
}

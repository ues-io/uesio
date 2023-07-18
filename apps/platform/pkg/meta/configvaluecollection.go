package meta

import (
	"strconv"
)

type ConfigValueCollection []*ConfigValue

var CONFIGVALUE_COLLECTION_NAME = "uesio/studio.configvalue"
var CONFIGVALUE_FOLDER_NAME = "configvalues"
var CONFIGVALUE_FIELDS = StandardGetFields(&ConfigValue{})

func (cvc *ConfigValueCollection) GetName() string {
	return CONFIGVALUE_COLLECTION_NAME
}

func (cvc *ConfigValueCollection) GetBundleFolderName() string {
	return CONFIGVALUE_FOLDER_NAME
}

func (cvc *ConfigValueCollection) GetFields() []string {
	return CONFIGVALUE_FIELDS
}

func (cvc *ConfigValueCollection) NewItem() Item {
	return &ConfigValue{}
}

func (cvc *ConfigValueCollection) AddItem(item Item) error {
	*cvc = append(*cvc, item.(*ConfigValue))
	return nil
}

func (cvc *ConfigValueCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseConfigValue(namespace, StandardNameFromPath(path))
}

func (cvc *ConfigValueCollection) GetItemFromKey(key string) (BundleableItem, error) {
	return NewConfigValue(key)
}

func (cvc *ConfigValueCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (cvc *ConfigValueCollection) GetItem(index int) Item {
	return (*cvc)[index]
}

func (cvc *ConfigValueCollection) Loop(iter GroupIterator) error {
	for index, cv := range *cvc {
		err := iter(cv, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (cvc *ConfigValueCollection) Len() int {
	return len(*cvc)
}

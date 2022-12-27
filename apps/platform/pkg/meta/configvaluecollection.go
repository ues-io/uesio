package meta

import (
	"strconv"
)

type ConfigValueCollection []*ConfigValue

var CONFIGVALUE_COLLECTION_NAME = "uesio/studio.configvalue"
var CONFIGVALUE_FOLDER_NAME = "configvalues"

func (cvc *ConfigValueCollection) GetName() string {
	return CONFIGVALUE_COLLECTION_NAME
}

func (cvc *ConfigValueCollection) GetBundleFolderName() string {
	return CONFIGVALUE_FOLDER_NAME
}

func (cvc *ConfigValueCollection) GetFields() []string {
	return StandardGetFields(&ConfigValue{})
}

func (cvc *ConfigValueCollection) NewItem() Item {
	return &ConfigValue{}
}

func (cvc *ConfigValueCollection) AddItem(item Item) {
	*cvc = append(*cvc, item.(*ConfigValue))
}

func (cvc *ConfigValueCollection) GetItemFromPath(path string) BundleableItem {
	return &ConfigValue{Name: StandardNameFromPath(path)}
}

func (cvc *ConfigValueCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (cvc *ConfigValueCollection) GetItem(index int) Item {
	return (*cvc)[index]
}

func (cvc *ConfigValueCollection) Loop(iter GroupIterator) error {
	for index := range *cvc {
		err := iter(cvc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (cvc *ConfigValueCollection) Len() int {
	return len(*cvc)
}

func (cvc *ConfigValueCollection) GetItems() interface{} {
	return *cvc
}

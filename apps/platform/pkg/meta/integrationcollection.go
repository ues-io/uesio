package meta

import (
	"strconv"
)

type IntegrationCollection []*Integration

var INTEGRATION_COLLECTION_NAME = "uesio/studio.integration"
var INTEGRATION_FOLDER_NAME = "integrations"

func (ic *IntegrationCollection) GetName() string {
	return INTEGRATION_COLLECTION_NAME
}

func (ic *IntegrationCollection) GetBundleFolderName() string {
	return INTEGRATION_FOLDER_NAME
}

func (ic *IntegrationCollection) GetFields() []string {
	return StandardGetFields(&Integration{})
}

func (ic *IntegrationCollection) NewItem() Item {
	return &Integration{}
}

func (ic *IntegrationCollection) AddItem(item Item) {
	*ic = append(*ic, item.(*Integration))
}

func (ic *IntegrationCollection) GetItemFromPath(path string) BundleableItem {
	return &Integration{Name: StandardNameFromPath(path)}
}

func (ic *IntegrationCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (ic *IntegrationCollection) GetItem(index int) Item {
	return (*ic)[index]
}

func (ic *IntegrationCollection) Loop(iter GroupIterator) error {
	for index := range *ic {
		err := iter(ic.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (ic *IntegrationCollection) Len() int {
	return len(*ic)
}

func (ic *IntegrationCollection) GetItems() interface{} {
	return *ic
}

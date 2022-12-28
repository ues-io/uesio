package meta

import (
	"strconv"
)

type IntegrationCollection []*Integration

var INTEGRATION_COLLECTION_NAME = "uesio/studio.integration"
var INTEGRATION_FOLDER_NAME = "integrations"
var INTEGRATION_FIELDS = StandardGetFields(&Integration{})

func (ic *IntegrationCollection) GetName() string {
	return INTEGRATION_COLLECTION_NAME
}

func (ic *IntegrationCollection) GetBundleFolderName() string {
	return INTEGRATION_FOLDER_NAME
}

func (ic *IntegrationCollection) GetFields() []string {
	return INTEGRATION_FIELDS
}

func (ic *IntegrationCollection) NewItem() Item {
	return &Integration{}
}

func (ic *IntegrationCollection) AddItem(item Item) {
	*ic = append(*ic, item.(*Integration))
}

func (ic *IntegrationCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseIntegration(namespace, StandardNameFromPath(path))
}

func (ic *IntegrationCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (ic *IntegrationCollection) Loop(iter GroupIterator) error {
	for index, i := range *ic {
		err := iter(i, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (ic *IntegrationCollection) Len() int {
	return len(*ic)
}

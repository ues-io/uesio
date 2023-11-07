package meta

import (
	"strconv"
)

type IntegrationTypeCollection []*IntegrationType

var INTEGRATION_TYPE_COLLECTION_NAME = "uesio/studio.integrationtype"
var INTEGRATION_TYPE_FOLDER_NAME = "integrationtypes"
var INTEGRATION_TYPE_FIELDS = StandardGetFields(&IntegrationType{})

func (ic *IntegrationTypeCollection) GetName() string {
	return INTEGRATION_TYPE_COLLECTION_NAME
}

func (ic *IntegrationTypeCollection) GetBundleFolderName() string {
	return INTEGRATION_TYPE_FOLDER_NAME
}

func (ic *IntegrationTypeCollection) GetFields() []string {
	return INTEGRATION_TYPE_FIELDS
}

func (ic *IntegrationTypeCollection) NewItem() Item {
	return &IntegrationType{}
}

func (ic *IntegrationTypeCollection) AddItem(item Item) error {
	*ic = append(*ic, item.(*IntegrationType))
	return nil
}

func (ic *IntegrationTypeCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseIntegrationType(namespace, StandardNameFromPath(path))
}

func (ic *IntegrationTypeCollection) GetItemFromKey(key string) (BundleableItem, error) {
	return NewIntegrationType(key)
}

func (ic *IntegrationTypeCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (ic *IntegrationTypeCollection) Loop(iter GroupIterator) error {
	for index, i := range *ic {
		err := iter(i, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (ic *IntegrationTypeCollection) Len() int {
	return len(*ic)
}

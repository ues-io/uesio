package meta

import (
	"strconv"
)

type IntegrationCollection []*Integration

func (ic *IntegrationCollection) GetName() string {
	return "uesio/studio.integration"
}

func (ic *IntegrationCollection) GetBundleFolderName() string {
	return "integrations"
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

func (ic *IntegrationCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewIntegration(key)
}

func (ic *IntegrationCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
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

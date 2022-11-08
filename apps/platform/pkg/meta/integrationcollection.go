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
	i := &Integration{}
	*ic = append(*ic, i)
	return i
}

func (ic *IntegrationCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	i, err := NewIntegration(key)
	if err != nil {
		return nil, err
	}
	*ic = append(*ic, i)
	return i, nil
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

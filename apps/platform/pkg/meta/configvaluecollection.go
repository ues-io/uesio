package meta

import (
	"strconv"
)

type ConfigValueCollection []*ConfigValue

func (cvc *ConfigValueCollection) GetName() string {
	return "uesio/studio.configvalue"
}

func (cvc *ConfigValueCollection) GetBundleFolderName() string {
	return "configvalues"
}

func (cvc *ConfigValueCollection) GetFields() []string {
	return StandardGetFields(&ConfigValue{})
}

func (cvc *ConfigValueCollection) NewItem() Item {
	cv := &ConfigValue{}
	*cvc = append(*cvc, cv)
	return cv
}

func (cvc *ConfigValueCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	cv, err := NewConfigValue(key)
	if err != nil {
		return nil, err
	}
	*cvc = append(*cvc, cv)
	return cv, nil
}

func (cvc *ConfigValueCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
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

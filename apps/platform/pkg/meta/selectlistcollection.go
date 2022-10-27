package meta

import (
	"errors"
	"strconv"
)

type SelectListCollection []*SelectList

func (slc *SelectListCollection) GetName() string {
	return "uesio/studio.selectlist"
}

func (slc *SelectListCollection) GetBundleFolderName() string {
	return "selectlists"
}

func (slc *SelectListCollection) GetFields() []string {
	return StandardGetFields(&SelectList{})
}

func (slc *SelectListCollection) NewItem() Item {
	sl := &SelectList{}
	*slc = append(*slc, sl)
	return sl
}

func (slc *SelectListCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Invalid SelectList Key: " + key)
	}
	sl := &SelectList{
		Namespace: namespace,
		Name:      name,
	}
	*slc = append(*slc, sl)
	return sl, nil
}

func (slc *SelectListCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

func (slc *SelectListCollection) GetItem(index int) Item {
	return (*slc)[index]
}

func (slc *SelectListCollection) Loop(iter GroupIterator) error {
	for index := range *slc {
		err := iter(slc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (slc *SelectListCollection) Len() int {
	return len(*slc)
}

func (slc *SelectListCollection) GetItems() interface{} {
	return *slc
}

package meta

import (
	"errors"
	"strconv"
)

type ViewCollection []*View

func (vc *ViewCollection) GetName() string {
	return "uesio/studio.view"
}

func (vc *ViewCollection) GetBundleFolderName() string {
	return "views"
}

func (vc *ViewCollection) GetFields() []string {
	return StandardGetFields(&View{})
}

func (vc *ViewCollection) NewItem() Item {
	v := &View{}
	*vc = append(*vc, v)
	return v
}

func (vc *ViewCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Invalid View Key: " + key)
	}
	v := &View{
		Namespace: namespace,
		Name:      name,
	}
	*vc = append(*vc, v)
	return v, nil
}

func (vc *ViewCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

func (vc *ViewCollection) GetItem(index int) Item {
	return (*vc)[index]
}

func (vc *ViewCollection) Loop(iter GroupIterator) error {
	for index := range *vc {
		err := iter(vc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (vc *ViewCollection) Len() int {
	return len(*vc)
}

func (vc *ViewCollection) GetItems() interface{} {
	return *vc
}

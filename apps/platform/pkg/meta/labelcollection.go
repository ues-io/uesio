package meta

import (
	"errors"
	"strconv"
)

type LabelCollection []*Label

func (lc *LabelCollection) GetName() string {
	return "uesio/studio.label"
}

func (lc *LabelCollection) GetBundleFolderName() string {
	return "labels"
}

func (lc *LabelCollection) GetFields() []string {
	return StandardGetFields(&Label{})
}

func (lc *LabelCollection) NewItem() Item {
	l := &Label{}
	*lc = append(*lc, l)
	return l
}

func (lc *LabelCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Invalid Label Key: " + key)
	}
	l := &Label{
		Namespace: namespace,
		Name:      name,
	}
	*lc = append(*lc, l)
	return l, nil
}

func (lc *LabelCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

func (lc *LabelCollection) GetItem(index int) Item {
	return (*lc)[index]
}

func (lc *LabelCollection) Loop(iter GroupIterator) error {
	for index := range *lc {
		err := iter(lc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (lc *LabelCollection) Len() int {
	return len(*lc)
}

func (lc *LabelCollection) GetItems() interface{} {
	return *lc
}

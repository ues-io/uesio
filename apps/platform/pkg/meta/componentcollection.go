package meta

import (
	"strconv"
)

type ComponentCollection []*Component

func (cc *ComponentCollection) GetName() string {
	return "uesio/studio.component"
}

func (cc *ComponentCollection) GetBundleFolderName() string {
	return "components"
}

func (cc *ComponentCollection) GetFields() []string {
	return StandardGetFields(&Component{})
}

func (cc *ComponentCollection) NewItem() Item {
	return &Component{}
}

func (cc *ComponentCollection) AddItem(item Item) {
	*cc = append(*cc, item.(*Component))
}

func (cc *ComponentCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewComponent(key)
}

func (cc *ComponentCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

func (cc *ComponentCollection) GetItem(index int) Item {
	return (*cc)[index]
}

func (cc *ComponentCollection) Loop(iter GroupIterator) error {
	for index := range *cc {
		err := iter(cc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (cc *ComponentCollection) Len() int {
	return len(*cc)
}

func (cc *ComponentCollection) GetItems() interface{} {
	return *cc
}

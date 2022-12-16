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

func (cc *ComponentCollection) GetItemFromPath(path string) (BundleableItem, bool) {
	return &Component{Name: StandardNameFromPath(path)}, true
}

func (cc *ComponentCollection) FilterPath(path string, conditions BundleConditions) bool {
	return StandardPathFilter(path)
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

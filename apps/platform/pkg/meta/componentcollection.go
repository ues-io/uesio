package meta

import (
	"strconv"
)

type ComponentCollection []*Component

var COMPONENT_COLLECTION_NAME = "uesio/studio.component"
var COMPONENT_FOLDER_NAME = "components"
var COMPONENT_FIELDS = StandardGetFields(&Component{})

func (cc *ComponentCollection) GetName() string {
	return COMPONENT_COLLECTION_NAME
}

func (cc *ComponentCollection) GetBundleFolderName() string {
	return COMPONENT_FOLDER_NAME
}

func (cc *ComponentCollection) GetFields() []string {
	return COMPONENT_FIELDS
}

func (cc *ComponentCollection) NewItem() Item {
	return &Component{}
}

func (cc *ComponentCollection) AddItem(item Item) error {
	*cc = append(*cc, item.(*Component))
	return nil
}

func (cc *ComponentCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseComponent(namespace, StandardNameFromPath(path))
}

func (cc *ComponentCollection) GetItemFromKey(key string) (BundleableItem, error) {
	return NewComponent(key)
}

func (cc *ComponentCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (cc *ComponentCollection) Loop(iter GroupIterator) error {
	for index, c := range *cc {
		err := iter(c, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (cc *ComponentCollection) Len() int {
	return len(*cc)
}

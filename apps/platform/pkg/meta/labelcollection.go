package meta

import (
	"strconv"
)

type LabelCollection []*Label

var LABEL_COLLECTION_NAME = "uesio/studio.label"
var LABEL_FOLDER_NAME = "labels"
var LABEL_FIELDS = StandardGetFields(&Label{})

func (lc *LabelCollection) GetName() string {
	return LABEL_COLLECTION_NAME
}

func (lc *LabelCollection) GetBundleFolderName() string {
	return LABEL_FOLDER_NAME
}

func (lc *LabelCollection) GetFields() []string {
	return LABEL_FIELDS
}

func (lc *LabelCollection) NewItem() Item {
	return &Label{}
}

func (lc *LabelCollection) AddItem(item Item) error {
	*lc = append(*lc, item.(*Label))
	return nil
}

func (lc *LabelCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseLabel(namespace, StandardNameFromPath(path))
}

func (lc *LabelCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (lc *LabelCollection) Loop(iter GroupIterator) error {
	for index, l := range *lc {
		err := iter(l, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (lc *LabelCollection) Len() int {
	return len(*lc)
}

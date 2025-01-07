package meta

import (
	"strconv"
	"strings"
)

type FontCollection []*Font

var FONT_COLLECTION_NAME = "uesio/studio.font"
var FONT_FOLDER_NAME = "fonts"
var FONT_FIELDS = StandardGetFields(&Font{})

func (fc *FontCollection) GetName() string {
	return FONT_COLLECTION_NAME
}

func (fc *FontCollection) GetBundleFolderName() string {
	return FONT_FOLDER_NAME
}

func (fc *FontCollection) GetFields() []string {
	return FONT_FIELDS
}

func (fc *FontCollection) NewItem() Item {
	return &Font{}
}

func (fc *FontCollection) AddItem(item Item) error {
	*fc = append(*fc, item.(*Font))
	return nil
}

func (fc *FontCollection) GetItemFromPath(path, namespace string) BundleableItem {
	parts := strings.Split(path, "/")
	return NewBaseFont(namespace, parts[0])
}

func (fc *FontCollection) GetItemFromKey(key string) (BundleableItem, error) {
	return NewFont(key)
}

func (fc *FontCollection) IsDefinitionPath(path string) bool {
	parts := strings.Split(path, "/")
	return len(parts) == 2 && parts[1] == "font.yaml"
}

func (fc *FontCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	if definitionOnly {
		return fc.IsDefinitionPath(path)
	}
	return true
}

func (fc *FontCollection) Loop(iter GroupIterator) error {
	for index, c := range *fc {
		err := iter(c, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (fc *FontCollection) Len() int {
	return len(*fc)
}

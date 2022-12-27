package meta

import (
	"strconv"
)

type AuthSourceCollection []*AuthSource

var AUTHSOURCE_COLLECTION_NAME = "uesio/studio.authsource"
var AUTHSOURCE_FOLDER_NAME = "authsources"

func (asc *AuthSourceCollection) GetName() string {
	return AUTHSOURCE_COLLECTION_NAME
}

func (asc *AuthSourceCollection) GetBundleFolderName() string {
	return AUTHSOURCE_FOLDER_NAME
}

func (asc *AuthSourceCollection) GetFields() []string {
	return StandardGetFields(&AuthSource{})
}

func (asc *AuthSourceCollection) NewItem() Item {
	return &AuthSource{}
}

func (asc *AuthSourceCollection) AddItem(item Item) {
	*asc = append(*asc, item.(*AuthSource))
}

func (asc *AuthSourceCollection) GetItemFromPath(path string) BundleableItem {
	return &AuthSource{Name: StandardNameFromPath(path)}
}

func (asc *AuthSourceCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (asc *AuthSourceCollection) GetItem(index int) Item {
	return (*asc)[index]
}

func (asc *AuthSourceCollection) Loop(iter GroupIterator) error {
	for index := range *asc {
		err := iter(asc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (asc *AuthSourceCollection) Len() int {
	return len(*asc)
}

func (asc *AuthSourceCollection) GetItems() interface{} {
	return *asc
}

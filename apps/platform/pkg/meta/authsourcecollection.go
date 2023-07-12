package meta

import (
	"strconv"
)

type AuthSourceCollection []*AuthSource

var AUTHSOURCE_COLLECTION_NAME = "uesio/studio.authsource"
var AUTHSOURCE_FOLDER_NAME = "authsources"
var AUTHSOURCE_FIELDS = StandardGetFields(&AuthSource{})

func (asc *AuthSourceCollection) GetName() string {
	return AUTHSOURCE_COLLECTION_NAME
}

func (asc *AuthSourceCollection) GetBundleFolderName() string {
	return AUTHSOURCE_FOLDER_NAME
}

func (asc *AuthSourceCollection) GetFields() []string {
	return AUTHSOURCE_FIELDS
}

func (asc *AuthSourceCollection) NewItem() Item {
	return &AuthSource{}
}

func (asc *AuthSourceCollection) AddItem(item Item) error {
	*asc = append(*asc, item.(*AuthSource))
	return nil
}

func (asc *AuthSourceCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseAuthSource(namespace, StandardNameFromPath(path))
}

func (asc *AuthSourceCollection) GetItemFromKey(key string) (BundleableItem, error) {
	return NewAuthSource(key)
}

func (asc *AuthSourceCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (asc *AuthSourceCollection) Loop(iter GroupIterator) error {
	for index, as := range *asc {
		err := iter(as, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (asc *AuthSourceCollection) Len() int {
	return len(*asc)
}

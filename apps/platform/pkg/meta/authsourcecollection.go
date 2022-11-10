package meta

import (
	"strconv"
)

type AuthSourceCollection []*AuthSource

func (asc *AuthSourceCollection) GetName() string {
	return "uesio/studio.authsource"
}

func (asc *AuthSourceCollection) GetBundleFolderName() string {
	return "authsources"
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

func (asc *AuthSourceCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewAuthSource(key)
}

func (asc *AuthSourceCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
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

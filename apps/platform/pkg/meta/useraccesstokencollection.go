package meta

import (
	"strconv"
)

type UserAccessTokenCollection []*UserAccessToken

func (uatc *UserAccessTokenCollection) GetName() string {
	return "uesio/studio.useraccesstoken"
}

func (uatc *UserAccessTokenCollection) GetBundleFolderName() string {
	return "useraccesstokens"
}

func (uatc *UserAccessTokenCollection) GetFields() []string {
	return StandardGetFields(&UserAccessToken{})
}

func (uatc *UserAccessTokenCollection) NewItem() Item {
	return &UserAccessToken{}
}

func (uatc *UserAccessTokenCollection) AddItem(item Item) {
	*uatc = append(*uatc, item.(*UserAccessToken))
}

func (uatc *UserAccessTokenCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewUserAccessToken(key)
}

func (uatc *UserAccessTokenCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

func (uatc *UserAccessTokenCollection) GetItem(index int) Item {
	return (*uatc)[index]
}

func (uatc *UserAccessTokenCollection) Loop(iter GroupIterator) error {
	for index := range *uatc {
		err := iter(uatc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (uatc *UserAccessTokenCollection) Len() int {
	return len(*uatc)
}

func (uatc *UserAccessTokenCollection) GetItems() interface{} {
	return *uatc
}

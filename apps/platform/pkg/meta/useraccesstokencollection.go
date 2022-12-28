package meta

import (
	"strconv"
)

type UserAccessTokenCollection []*UserAccessToken

var USERACCESSTOKEN_COLLECTION_NAME = "uesio/studio.useraccesstoken"
var USERACCESSTOKEN_FOLDER_NAME = "useraccesstokens"
var USERACCESSTOKEN_FIELDS = StandardGetFields(&UserAccessToken{})

func (uatc *UserAccessTokenCollection) GetName() string {
	return USERACCESSTOKEN_COLLECTION_NAME
}

func (uatc *UserAccessTokenCollection) GetBundleFolderName() string {
	return USERACCESSTOKEN_FOLDER_NAME
}

func (uatc *UserAccessTokenCollection) GetFields() []string {
	return USERACCESSTOKEN_FIELDS
}

func (uatc *UserAccessTokenCollection) NewItem() Item {
	return &UserAccessToken{}
}

func (uatc *UserAccessTokenCollection) AddItem(item Item) {
	*uatc = append(*uatc, item.(*UserAccessToken))
}

func (uatc *UserAccessTokenCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseUserAccessToken(namespace, StandardNameFromPath(path))
}

func (uatc *UserAccessTokenCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (uatc *UserAccessTokenCollection) Loop(iter GroupIterator) error {
	for index, uat := range *uatc {
		err := iter(uat, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (uatc *UserAccessTokenCollection) Len() int {
	return len(*uatc)
}

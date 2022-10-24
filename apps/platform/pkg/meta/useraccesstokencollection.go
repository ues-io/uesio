package meta

import (
	"errors"
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
	uat := &UserAccessToken{}
	*uatc = append(*uatc, uat)
	return uat
}

func (uatc *UserAccessTokenCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Invalid User Access Token Key: " + key)
	}
	uat := &UserAccessToken{
		Namespace: namespace,
		Name:      name,
	}
	*uatc = append(*uatc, uat)
	return uat, nil
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

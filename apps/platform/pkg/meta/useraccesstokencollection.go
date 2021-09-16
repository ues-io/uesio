package meta

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type UserAccessTokenCollection []UserAccessToken

func (uatc *UserAccessTokenCollection) Filter(iter func(item loadable.Item) (bool, error)) error {
	return nil
}

// GetName function
func (uatc *UserAccessTokenCollection) GetName() string {
	return "studio.useraccesstokens"
}

// GetFields function
func (uatc *UserAccessTokenCollection) GetFields() []string {
	return StandardGetFields(&UserAccessToken{})
}

// NewItem function
func (uatc *UserAccessTokenCollection) NewItem() loadable.Item {
	*uatc = append(*uatc, UserAccessToken{})
	return &(*uatc)[len(*uatc)-1]
}

// NewBundleableItemWithKey function
func (uatc *UserAccessTokenCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid User Access Token Key: " + key)
	}
	*uatc = append(*uatc, UserAccessToken{
		Namespace: keyArray[0],
		Name:      keyArray[1],
	})
	return &(*uatc)[len(*uatc)-1], nil
}

// GetKeyFromPath function
func (uatc *UserAccessTokenCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
}

// GetItem function
func (uatc *UserAccessTokenCollection) GetItem(index int) loadable.Item {
	return &(*uatc)[index]
}

// Loop function
func (uatc *UserAccessTokenCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *uatc {
		err := iter(uatc.GetItem(index), index)
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (uatc *UserAccessTokenCollection) Len() int {
	return len(*uatc)
}

// GetItems function
func (uatc *UserAccessTokenCollection) GetItems() interface{} {
	return *uatc
}

// Slice function
func (uatc *UserAccessTokenCollection) Slice(start int, end int) {

}

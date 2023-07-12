package meta

import (
	"strconv"
)

type ProfileCollection []*Profile

var PROFILE_COLLECTION_NAME = "uesio/studio.profile"
var PROFILE_FOLDER_NAME = "profiles"
var PROFILE_FIELDS = StandardGetFields(&Profile{})

func (pc *ProfileCollection) GetName() string {
	return PROFILE_COLLECTION_NAME
}

func (pc *ProfileCollection) GetBundleFolderName() string {
	return PROFILE_FOLDER_NAME
}

func (pc *ProfileCollection) GetFields() []string {
	return PROFILE_FIELDS
}

func (pc *ProfileCollection) NewItem() Item {
	return &Profile{}
}

func (pc *ProfileCollection) AddItem(item Item) error {
	*pc = append(*pc, item.(*Profile))
	return nil
}

func (pc *ProfileCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseProfile(namespace, StandardNameFromPath(path))
}

func (pc *ProfileCollection) GetItemFromKey(key string) (BundleableItem, error) {
	return NewProfile(key)
}

func (pc *ProfileCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (pc *ProfileCollection) Loop(iter GroupIterator) error {
	for index, p := range *pc {
		err := iter(p, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (pc *ProfileCollection) Len() int {
	return len(*pc)
}

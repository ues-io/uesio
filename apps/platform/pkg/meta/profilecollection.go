package meta

import (
	"strconv"
)

type ProfileCollection []*Profile

var PROFILE_COLLECTION_NAME = "uesio/studio.profile"
var PROFILE_FOLDER_NAME = "profiles"

func (pc *ProfileCollection) GetName() string {
	return PROFILE_COLLECTION_NAME
}

func (pc *ProfileCollection) GetBundleFolderName() string {
	return PROFILE_FOLDER_NAME
}

func (pc *ProfileCollection) GetFields() []string {
	return StandardGetFields(&Profile{})
}

func (pc *ProfileCollection) NewItem() Item {
	return &Profile{}
}

func (pc *ProfileCollection) AddItem(item Item) {
	*pc = append(*pc, item.(*Profile))
}

func (pc *ProfileCollection) GetItemFromPath(path string) BundleableItem {
	return &Profile{Name: StandardNameFromPath(path)}
}

func (pc *ProfileCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (pc *ProfileCollection) GetItem(index int) Item {
	return (*pc)[index]
}

func (pc *ProfileCollection) Loop(iter GroupIterator) error {
	for index := range *pc {
		err := iter(pc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (pc *ProfileCollection) Len() int {
	return len(*pc)
}

func (pc *ProfileCollection) GetItems() interface{} {
	return *pc
}

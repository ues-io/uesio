package meta

import (
	"strconv"
)

type ProfileCollection []*Profile

func (pc *ProfileCollection) GetName() string {
	return "uesio/studio.profile"
}

func (pc *ProfileCollection) GetBundleFolderName() string {
	return "profiles"
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

func (pc *ProfileCollection) GetItemFromPath(path string) (BundleableItem, bool) {
	return &Profile{Name: StandardNameFromPath(path)}, true
}

func (pc *ProfileCollection) FilterPath(path string, conditions BundleConditions) bool {
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

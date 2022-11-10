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

func (pc *ProfileCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewProfile(key)
}

func (pc *ProfileCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
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

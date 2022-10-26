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
	p := &Profile{}
	*pc = append(*pc, p)
	return p
}

func (pc *ProfileCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	p, err := NewProfile(key)
	if err != nil {
		return nil, err
	}
	*pc = append(*pc, p)
	return p, nil
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

package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// ProfileCollection slice
type ProfileCollection []Profile

// GetName function
func (pc *ProfileCollection) GetName() string {
	return "uesio/studio.profiles"
}

// GetFields function
func (pc *ProfileCollection) GetFields() []string {
	return StandardGetFields(&Profile{})
}

// NewItem function
func (pc *ProfileCollection) NewItem() loadable.Item {
	*pc = append(*pc, Profile{})
	return &(*pc)[len(*pc)-1]
}

// NewBundleableItemWithKey function
func (pc *ProfileCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	p, err := NewProfile(key)
	if err != nil {
		return nil, err
	}
	*pc = append(*pc, *p)
	return &(*pc)[len(*pc)-1], nil
}

// GetKeyFromPath function
func (pc *ProfileCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

// GetItem function
func (pc *ProfileCollection) GetItem(index int) loadable.Item {
	return &(*pc)[index]
}

// Loop function
func (pc *ProfileCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *pc {
		err := iter(pc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (pc *ProfileCollection) Len() int {
	return len(*pc)
}

// GetItems function
func (pc *ProfileCollection) GetItems() interface{} {
	return *pc
}

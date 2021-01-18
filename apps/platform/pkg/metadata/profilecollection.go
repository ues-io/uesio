package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// ProfileCollection slice
type ProfileCollection []Profile

// GetName function
func (pc *ProfileCollection) GetName() string {
	return "profiles"
}

// GetFields function
func (pc *ProfileCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(pc)
}

// NewItem function
func (pc *ProfileCollection) NewItem() adapters.LoadableItem {
	return &Profile{}
}

// NewBundleableItem function
func (pc *ProfileCollection) NewBundleableItem() BundleableItem {
	return &Profile{}
}

// NewBundleableItem function
func (pc *ProfileCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewProfile(key)
}

// GetKeyFromPath function
func (pc *ProfileCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
}

// AddItem function
func (pc *ProfileCollection) AddItem(item adapters.LoadableItem) {
	*pc = append(*pc, *item.(*Profile))
}

// GetItem function
func (pc *ProfileCollection) GetItem(index int) adapters.LoadableItem {
	return &(*pc)[index]
}

// Loop function
func (pc *ProfileCollection) Loop(iter func(item adapters.LoadableItem) error) error {
	for index := range *pc {
		err := iter(pc.GetItem(index))
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
	return pc
}

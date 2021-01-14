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

// GetKeyPrefix function
func (pc *ProfileCollection) GetKeyPrefix(conditions BundleConditions) string {
	return ""
}

// AddItem function
func (pc *ProfileCollection) AddItem(item adapters.LoadableItem) {
	*pc = append(*pc, *item.(*Profile))
}

// GetItem function
func (pc *ProfileCollection) GetItem(index int) adapters.LoadableItem {
	actual := *pc
	return &actual[index]
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

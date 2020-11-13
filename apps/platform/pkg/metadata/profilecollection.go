package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// ProfileCollection slice
type ProfileCollection []Profile

// GetName function
func (pc *ProfileCollection) GetName() string {
	return "profiles"
}

// GetFields function
func (pc *ProfileCollection) GetFields() []string {
	return []string{"id"}
}

// NewItem function
func (pc *ProfileCollection) NewItem(key string) (BundleableItem, error) {
	return NewProfile(key)
}

// GetKeyPrefix function
func (pc *ProfileCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (pc *ProfileCollection) AddItem(item BundleableItem) {
}

// UnMarshal function
func (pc *ProfileCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(pc, data)
}

// Marshal function
func (pc *ProfileCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(pc)
}

// GetItem function
func (pc *ProfileCollection) GetItem(index int) CollectionableItem {
	actual := *pc
	return &actual[index]
}

// Loop function
func (pc *ProfileCollection) Loop(iter func(item CollectionableItem) error) error {
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

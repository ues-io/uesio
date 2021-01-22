package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// UserFileMetadataCollection slice
type UserFileMetadataCollection []UserFileMetadata

// GetName function
func (ufmc *UserFileMetadataCollection) GetName() string {
	return "userfiles"
}

// GetFields function
func (ufmc *UserFileMetadataCollection) GetFields() []string {
	return StandardGetFields(ufmc)
}

// AddItem function
func (ufmc *UserFileMetadataCollection) AddItem(item loadable.Item) {
	*ufmc = append(*ufmc, *item.(*UserFileMetadata))
}

// NewItem function
func (ufmc *UserFileMetadataCollection) NewItem() loadable.Item {
	return &UserFileMetadata{}
}

// GetItem function
func (ufmc *UserFileMetadataCollection) GetItem(index int) loadable.Item {
	return &(*ufmc)[index]
}

// Loop function
func (ufmc *UserFileMetadataCollection) Loop(iter func(item loadable.Item) error) error {
	for index := range *ufmc {
		err := iter(ufmc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (ufmc *UserFileMetadataCollection) Len() int {
	return len(*ufmc)
}

// GetItems function
func (ufmc *UserFileMetadataCollection) GetItems() interface{} {
	return ufmc
}

// Slice function
func (ufmc *UserFileMetadataCollection) Slice(start int, end int) {

}

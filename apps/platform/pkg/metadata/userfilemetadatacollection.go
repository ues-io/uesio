package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// UserFileMetadataCollection slice
type UserFileMetadataCollection []UserFileMetadata

// GetName function
func (ufmc *UserFileMetadataCollection) GetName() string {
	return "userfiles"
}

// GetFields function
func (ufmc *UserFileMetadataCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(ufmc)
}

// AddItem function
func (ufmc *UserFileMetadataCollection) AddItem(item adapters.LoadableItem) {
	*ufmc = append(*ufmc, *item.(*UserFileMetadata))
}

// NewItem function
func (ufmc *UserFileMetadataCollection) NewItem() adapters.LoadableItem {
	return &UserFileMetadata{}
}

// GetItem function
func (ufmc *UserFileMetadataCollection) GetItem(index int) adapters.LoadableItem {
	actual := *ufmc
	return &actual[index]
}

// Loop function
func (ufmc *UserFileMetadataCollection) Loop(iter func(item adapters.LoadableItem) error) error {
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

// Sort function
func (ufmc *UserFileMetadataCollection) Sort(order []adapters.LoadRequestOrder, collectionMetadata *adapters.CollectionMetadata) {
	println("Sort")
}

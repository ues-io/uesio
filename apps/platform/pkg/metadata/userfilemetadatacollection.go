package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// UserFileMetadataCollection slice
type UserFileMetadataCollection []UserFileMetadata

// GetName function
func (ufmc *UserFileMetadataCollection) GetName() string {
	return "userfiles"
}

// GetFields function
func (ufmc *UserFileMetadataCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(ufmc)
}

// AddItem function
func (ufmc *UserFileMetadataCollection) AddItem(item LoadableItem) {
	*ufmc = append(*ufmc, *item.(*UserFileMetadata))
}

// NewItem function
func (ufmc *UserFileMetadataCollection) NewItem() LoadableItem {
	return &UserFileMetadata{}
}

// GetItem function
func (ufmc *UserFileMetadataCollection) GetItem(index int) LoadableItem {
	actual := *ufmc
	return &actual[index]
}

// Loop function
func (ufmc *UserFileMetadataCollection) Loop(iter func(item LoadableItem) error) error {
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

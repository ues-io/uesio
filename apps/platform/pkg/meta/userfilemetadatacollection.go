package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// UserFileMetadataCollection slice
type UserFileMetadataCollection []UserFileMetadata

// GetName function
func (ufmc *UserFileMetadataCollection) GetName() string {
	return "uesio/uesio.userfiles"
}

// GetFields function
func (ufmc *UserFileMetadataCollection) GetFields() []string {
	return StandardGetFields(&UserFileMetadata{})
}

// NewItem function
func (ufmc *UserFileMetadataCollection) NewItem() loadable.Item {
	*ufmc = append(*ufmc, UserFileMetadata{})
	return &(*ufmc)[len(*ufmc)-1]
}

// GetItem function
func (ufmc *UserFileMetadataCollection) GetItem(index int) loadable.Item {
	return &(*ufmc)[index]
}

// Loop function
func (ufmc *UserFileMetadataCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *ufmc {
		err := iter(ufmc.GetItem(index), strconv.Itoa(index))
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
	return *ufmc
}

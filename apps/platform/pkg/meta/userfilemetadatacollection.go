package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type UserFileMetadataCollection []*UserFileMetadata

func (ufmc *UserFileMetadataCollection) GetName() string {
	return "uesio/core.userfile"
}

func (ufmc *UserFileMetadataCollection) GetFields() []string {
	return StandardGetFields(&UserFileMetadata{})
}

func (ufmc *UserFileMetadataCollection) NewItem() loadable.Item {
	ufm := &UserFileMetadata{}
	*ufmc = append(*ufmc, ufm)
	return ufm
}

func (ufmc *UserFileMetadataCollection) GetItem(index int) loadable.Item {
	return (*ufmc)[index]
}

func (ufmc *UserFileMetadataCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *ufmc {
		err := iter(ufmc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (ufmc *UserFileMetadataCollection) Len() int {
	return len(*ufmc)
}

func (ufmc *UserFileMetadataCollection) GetItems() interface{} {
	return *ufmc
}

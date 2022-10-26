package meta

import (
	"strconv"
)

type UserFileMetadataCollection []*UserFileMetadata

func (ufmc *UserFileMetadataCollection) GetName() string {
	return "uesio/core.userfile"
}

func (ufmc *UserFileMetadataCollection) GetFields() []string {
	return StandardGetFields(&UserFileMetadata{})
}

func (ufmc *UserFileMetadataCollection) NewItem() Item {
	ufm := &UserFileMetadata{}
	*ufmc = append(*ufmc, ufm)
	return ufm
}

func (ufmc *UserFileMetadataCollection) GetItem(index int) Item {
	return (*ufmc)[index]
}

func (ufmc *UserFileMetadataCollection) Loop(iter GroupIterator) error {
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

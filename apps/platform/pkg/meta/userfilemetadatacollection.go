package meta

import (
	"strconv"
)

type UserFileMetadataCollection []*UserFileMetadata

var USERFILEMETADATA_COLLECTION_NAME = "uesio/core.userfile"
var USERFILEMETADATA_FIELDS = StandardGetFields(&UserFileMetadata{})

func (ufmc *UserFileMetadataCollection) GetName() string {
	return USERFILEMETADATA_COLLECTION_NAME
}

func (ufmc *UserFileMetadataCollection) GetFields() []string {
	return USERACCESSTOKEN_FIELDS
}

func (ufmc *UserFileMetadataCollection) NewItem() Item {
	return &UserFileMetadata{}
}

func (ufmc *UserFileMetadataCollection) AddItem(item Item) {
	*ufmc = append(*ufmc, item.(*UserFileMetadata))
}

func (ufmc *UserFileMetadataCollection) Loop(iter GroupIterator) error {
	for index, ufm := range *ufmc {
		err := iter(ufm, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (ufmc *UserFileMetadataCollection) Len() int {
	return len(*ufmc)
}

package meta

import (
	"strconv"
)

type CredentialCollection []*Credential

var CREDENTIAL_COLLECTION_NAME = "uesio/studio.credential"
var CREDENTIAL_FOLDER_NAME = "credentials"

func (cc *CredentialCollection) GetName() string {
	return CREDENTIAL_COLLECTION_NAME
}

func (cc *CredentialCollection) GetBundleFolderName() string {
	return CREDENTIAL_FOLDER_NAME
}

func (cc *CredentialCollection) GetFields() []string {
	return StandardGetFields(&Credential{})
}

func (cc *CredentialCollection) NewItem() Item {
	return &Credential{}
}

func (cc *CredentialCollection) AddItem(item Item) {
	*cc = append(*cc, item.(*Credential))
}

func (cc *CredentialCollection) GetItemFromPath(path string) BundleableItem {
	return &Credential{Name: StandardNameFromPath(path)}
}

func (cc *CredentialCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (cc *CredentialCollection) GetItem(index int) Item {
	return (*cc)[index]
}

func (cc *CredentialCollection) Loop(iter GroupIterator) error {
	for index := range *cc {
		err := iter(cc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (cc *CredentialCollection) Len() int {
	return len(*cc)
}

func (cc *CredentialCollection) GetItems() interface{} {
	return *cc
}

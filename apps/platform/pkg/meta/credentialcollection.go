package meta

import (
	"strconv"
)

type CredentialCollection []*Credential

func (cc *CredentialCollection) GetName() string {
	return "uesio/studio.credential"
}

func (cc *CredentialCollection) GetBundleFolderName() string {
	return "credentials"
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

func (cc *CredentialCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewCredential(key)
}

func (cc *CredentialCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
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

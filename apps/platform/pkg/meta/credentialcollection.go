package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
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

func (cc *CredentialCollection) NewItem() loadable.Item {
	c := &Credential{}
	*cc = append(*cc, c)
	return c
}

func (cc *CredentialCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	c, err := NewCredential(key)
	if err != nil {
		return nil, err
	}
	*cc = append(*cc, c)
	return c, nil
}

func (cc *CredentialCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

func (cc *CredentialCollection) GetItem(index int) loadable.Item {
	return (*cc)[index]
}

func (cc *CredentialCollection) Loop(iter loadable.GroupIterator) error {
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

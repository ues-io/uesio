package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// CredentialCollection slice
type CredentialCollection []Credential

// GetName function
func (cc *CredentialCollection) GetName() string {
	return "studio.credentials"
}

// GetFields function
func (cc *CredentialCollection) GetFields() []string {
	return StandardGetFields(&Credential{})
}

// NewItem function
func (cc *CredentialCollection) NewItem() loadable.Item {
	*cc = append(*cc, Credential{})
	return &(*cc)[len(*cc)-1]
}

// NewBundleableItemWithKey function
func (cc *CredentialCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	c, err := NewCredential(key)
	if err != nil {
		return nil, err
	}
	*cc = append(*cc, *c)
	return &(*cc)[len(*cc)-1], nil
}

// GetKeyFromPath function
func (cc *CredentialCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
}

// GetItem function
func (cc *CredentialCollection) GetItem(index int) loadable.Item {
	return &(*cc)[index]
}

// Loop function
func (cc *CredentialCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *cc {
		err := iter(cc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (cc *CredentialCollection) Len() int {
	return len(*cc)
}

// GetItems function
func (cc *CredentialCollection) GetItems() interface{} {
	return *cc
}

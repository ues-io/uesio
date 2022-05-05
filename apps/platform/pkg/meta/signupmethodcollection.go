package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type SignupMethodCollection []*SignupMethod

func (smc *SignupMethodCollection) GetName() string {
	return "uesio/studio.signupmethod"
}

func (smc *SignupMethodCollection) GetBundleFolderName() string {
	return "signupmethods"
}

func (smc *SignupMethodCollection) GetFields() []string {
	return StandardGetFields(&SignupMethod{})
}

func (smc *SignupMethodCollection) NewItem() loadable.Item {
	sm := &SignupMethod{}
	*smc = append(*smc, sm)
	return sm
}

func (smc *SignupMethodCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	sm, err := NewSignupMethod(key)
	if err != nil {
		return nil, err
	}
	*smc = append(*smc, sm)
	return sm, nil
}

func (smc *SignupMethodCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

func (smc *SignupMethodCollection) GetItem(index int) loadable.Item {
	return (*smc)[index]
}

func (smc *SignupMethodCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *smc {
		err := iter(smc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (smc *SignupMethodCollection) Len() int {
	return len(*smc)
}

func (smc *SignupMethodCollection) GetItems() interface{} {
	return *smc
}

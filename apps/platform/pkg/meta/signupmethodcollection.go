package meta

import (
	"strconv"
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

func (smc *SignupMethodCollection) NewItem() Item {
	return &SignupMethod{}
}

func (smc *SignupMethodCollection) AddItem(item Item) {
	*smc = append(*smc, item.(*SignupMethod))
}

func (smc *SignupMethodCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewSignupMethod(key)
}

func (smc *SignupMethodCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

func (smc *SignupMethodCollection) GetItem(index int) Item {
	return (*smc)[index]
}

func (smc *SignupMethodCollection) Loop(iter GroupIterator) error {
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

package meta

import (
	"strconv"
)

type SignupMethodCollection []*SignupMethod

var SIGNUPMETHOD_COLLECTION_NAME = "uesio/studio.signupmethod"
var SIGNUPMETHOD_FOLDER_NAME = "signupmethods"

func (smc *SignupMethodCollection) GetName() string {
	return SIGNUPMETHOD_COLLECTION_NAME
}

func (smc *SignupMethodCollection) GetBundleFolderName() string {
	return SIGNUPMETHOD_FOLDER_NAME
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

func (smc *SignupMethodCollection) GetItemFromPath(path string) BundleableItem {
	return &SignupMethod{Name: StandardNameFromPath(path)}
}

func (smc *SignupMethodCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
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

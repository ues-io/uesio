package meta

import (
	"strconv"
)

type SignupMethodCollection []*SignupMethod

var SIGNUPMETHOD_COLLECTION_NAME = "uesio/studio.signupmethod"
var SIGNUPMETHOD_FOLDER_NAME = "signupmethods"
var SIGNUPMETHOD_FIELDS = StandardGetFields(&SignupMethod{})

func (smc *SignupMethodCollection) GetName() string {
	return SIGNUPMETHOD_COLLECTION_NAME
}

func (smc *SignupMethodCollection) GetBundleFolderName() string {
	return SIGNUPMETHOD_FOLDER_NAME
}

func (smc *SignupMethodCollection) GetFields() []string {
	return SIGNUPMETHOD_FIELDS
}

func (smc *SignupMethodCollection) NewItem() Item {
	return &SignupMethod{}
}

func (smc *SignupMethodCollection) AddItem(item Item) error {
	*smc = append(*smc, item.(*SignupMethod))
	return nil
}

func (smc *SignupMethodCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseSignupMethod(namespace, StandardNameFromPath(path))
}

func (smc *SignupMethodCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (smc *SignupMethodCollection) Loop(iter GroupIterator) error {
	for index, sm := range *smc {
		err := iter(sm, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (smc *SignupMethodCollection) Len() int {
	return len(*smc)
}

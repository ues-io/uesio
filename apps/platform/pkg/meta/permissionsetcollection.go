package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type PermissionSetCollection []*PermissionSet

func (pc *PermissionSetCollection) GetName() string {
	return "uesio/studio.permissionset"
}

func (pc *PermissionSetCollection) GetBundleFolderName() string {
	return "permissionsets"
}

func (pc *PermissionSetCollection) GetFields() []string {
	return StandardGetFields(&PermissionSet{})
}

func (pc *PermissionSetCollection) NewItem() loadable.Item {
	p := &PermissionSet{}
	*pc = append(*pc, p)
	return p
}

func (pc *PermissionSetCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	p, err := NewPermissionSet(key)
	if err != nil {
		return nil, err
	}
	*pc = append(*pc, p)
	return p, nil
}

func (pc *PermissionSetCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

func (pc *PermissionSetCollection) GetItem(index int) loadable.Item {
	return (*pc)[index]
}

func (pc *PermissionSetCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *pc {
		err := iter(pc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (pc *PermissionSetCollection) Len() int {
	return len(*pc)
}

func (pc *PermissionSetCollection) GetItems() interface{} {
	return *pc
}

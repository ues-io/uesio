package meta

import (
	"strconv"
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

func (pc *PermissionSetCollection) NewItem() Item {
	return &PermissionSet{}
}

func (pc *PermissionSetCollection) AddItem(item Item) {
	*pc = append(*pc, item.(*PermissionSet))
}

func (pc *PermissionSetCollection) GetItemFromPath(path string) BundleableItem {
	return &PermissionSet{Name: StandardNameFromPath(path)}
}

func (pc *PermissionSetCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (pc *PermissionSetCollection) GetItem(index int) Item {
	return (*pc)[index]
}

func (pc *PermissionSetCollection) Loop(iter GroupIterator) error {
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

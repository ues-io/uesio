package meta

import (
	"strconv"
)

type WorkspaceUserCollection []*WorkspaceUser

var WORKSPACEUSER_COLLECTION_NAME = "uesio/studio.workspaceuser"
var WORKSPACEUSER_FOLDER_NAME = "workspaceusers"

// We have to hardcode these fields because workspace users don't have a uesio/studio.name
// field that we want to query. If we used the StandardGetFields (like the other metadata items)
// it would try to query for a name field that does not exist.
var WORKSPACEUSER_FIELDS = []string{
	"uesio/core.id",
	"uesio/core.uniquekey",
	"uesio/core.createdby",
	"uesio/core.owner",
	"uesio/core.updatedby",
	"uesio/core.updatedat",
	"uesio/core.createdat",
	"uesio/studio.workspace",
	"uesio/studio.user",
	"uesio/studio.profile",
}

func (pc *WorkspaceUserCollection) GetName() string {
	return WORKSPACEUSER_COLLECTION_NAME
}

func (pc *WorkspaceUserCollection) GetBundleFolderName() string {
	return WORKSPACEUSER_FOLDER_NAME
}

func (pc *WorkspaceUserCollection) GetFields() []string {
	println("LOL")
	return WORKSPACEUSER_FIELDS
}

func (pc *WorkspaceUserCollection) NewItem() Item {
	return &WorkspaceUser{}
}

func (pc *WorkspaceUserCollection) AddItem(item Item) error {
	*pc = append(*pc, item.(*WorkspaceUser))
	return nil
}

// func (pc *WorkspaceUserCollection) GetItemFromPath(path, namespace string) BundleableItem {
// 	return NewBaseWorkspaceUser(namespace, StandardNameFromPath(path))
// }

// func (pc *WorkspaceUserCollection) GetItemFromKey(key string) (BundleableItem, error) {
// 	return NewWorkspaceUser(key)
// }

func (pc *WorkspaceUserCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (pc *WorkspaceUserCollection) Loop(iter GroupIterator) error {
	for index, p := range *pc {
		err := iter(p, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (pc *WorkspaceUserCollection) Len() int {
	return len(*pc)
}

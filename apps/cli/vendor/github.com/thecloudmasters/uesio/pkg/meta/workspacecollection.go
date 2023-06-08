package meta

import (
	"strconv"
)

type WorkspaceCollection []*Workspace

var WORKSPACE_COLLECTION_NAME = "uesio/studio.workspace"
var WORKSPACE_FIELDS = StandardGetFields(&Workspace{})

func (wc *WorkspaceCollection) GetName() string {
	return WORKSPACE_COLLECTION_NAME
}

func (wc *WorkspaceCollection) GetFields() []string {
	return WORKSPACE_FIELDS
}

func (wc *WorkspaceCollection) NewItem() Item {
	return &Workspace{}
}

func (wc *WorkspaceCollection) AddItem(item Item) error {
	*wc = append(*wc, item.(*Workspace))
	return nil
}

func (wc *WorkspaceCollection) Loop(iter GroupIterator) error {
	for index, w := range *wc {
		err := iter(w, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (wc *WorkspaceCollection) Len() int {
	return len(*wc)
}

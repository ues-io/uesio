package meta

import (
	"strconv"
)

type WorkspaceCollection []*Workspace

var WORKSPACE_COLLECTION_NAME = "uesio/studio.workspace"

func (wc *WorkspaceCollection) GetName() string {
	return WORKSPACE_COLLECTION_NAME
}

func (wc *WorkspaceCollection) GetFields() []string {
	return StandardGetFields(&Workspace{})
}

func (wc *WorkspaceCollection) GetItem(index int) Item {
	return (*wc)[index]
}

func (wc *WorkspaceCollection) NewItem() Item {
	return &Workspace{}
}

func (wc *WorkspaceCollection) AddItem(item Item) {
	*wc = append(*wc, item.(*Workspace))
}

func (wc *WorkspaceCollection) Loop(iter GroupIterator) error {
	for index := range *wc {
		err := iter(wc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (wc *WorkspaceCollection) Len() int {
	return len(*wc)
}

func (wc *WorkspaceCollection) GetItems() interface{} {
	return *wc
}

package meta

import (
	"strconv"
)

type WorkspaceCollection []*Workspace

func (wc *WorkspaceCollection) GetName() string {
	return "uesio/studio.workspace"
}

func (wc *WorkspaceCollection) GetFields() []string {
	return StandardGetFields(&Workspace{})
}

func (wc *WorkspaceCollection) GetItem(index int) Item {
	return (*wc)[index]
}

func (wc *WorkspaceCollection) NewItem() Item {
	w := &Workspace{}
	*wc = append(*wc, w)
	return w
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

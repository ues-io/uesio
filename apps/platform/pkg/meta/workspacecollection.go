package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// WorkspaceCollection slice
type WorkspaceCollection []Workspace

// GetName function
func (wc *WorkspaceCollection) GetName() string {
	return "studio.workspaces"
}

// GetFields function
func (wc *WorkspaceCollection) GetFields() []string {
	return StandardGetFields(&Workspace{})
}

// GetItem function
func (wc *WorkspaceCollection) GetItem(index int) loadable.Item {
	return &(*wc)[index]
}

// NewItem function
func (wc *WorkspaceCollection) NewItem() loadable.Item {
	*wc = append(*wc, Workspace{})
	return &(*wc)[len(*wc)-1]
}

// Loop function
func (wc *WorkspaceCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *wc {
		err := iter(wc.GetItem(index), index)
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (wc *WorkspaceCollection) Len() int {
	return len(*wc)
}

// GetItems function
func (wc *WorkspaceCollection) GetItems() interface{} {
	return *wc
}

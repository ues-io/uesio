package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// WorkspaceCollection slice
type WorkspaceCollection []Workspace

// GetName function
func (wc *WorkspaceCollection) GetName() string {
	return "workspaces"
}

// GetFields function
func (wc *WorkspaceCollection) GetFields() []string {
	return StandardGetFields(&Workspace{})
}

// GetItem function
func (wc *WorkspaceCollection) GetItem(index int) loadable.Item {
	return &(*wc)[index]
}

// AddItem function
func (wc *WorkspaceCollection) AddItem(item loadable.Item) {
	*wc = append(*wc, *item.(*Workspace))
}

// NewItem function
func (wc *WorkspaceCollection) NewItem() loadable.Item {
	return &Workspace{}
}

// Loop function
func (wc *WorkspaceCollection) Loop(iter func(item loadable.Item) error) error {
	for index := range *wc {
		err := iter(wc.GetItem(index))
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
	return wc
}

// Slice function
func (wc *WorkspaceCollection) Slice(start int, end int) {

}

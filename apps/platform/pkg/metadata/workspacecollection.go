package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// WorkspaceCollection slice
type WorkspaceCollection []Workspace

// GetName function
func (wc *WorkspaceCollection) GetName() string {
	return "workspaces"
}

// GetFields function
func (wc *WorkspaceCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(wc)
}

// GetItem function
func (wc *WorkspaceCollection) GetItem(index int) adapters.LoadableItem {
	actual := *wc
	return &actual[index]
}

// AddItem function
func (wc *WorkspaceCollection) AddItem(item adapters.LoadableItem) {
	*wc = append(*wc, *item.(*Workspace))
}

// NewItem function
func (wc *WorkspaceCollection) NewItem() adapters.LoadableItem {
	return &Workspace{}
}

// Loop function
func (wc *WorkspaceCollection) Loop(iter func(item adapters.LoadableItem) error) error {
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

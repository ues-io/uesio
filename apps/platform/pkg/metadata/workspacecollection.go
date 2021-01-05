package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// WorkspaceCollection slice
type WorkspaceCollection []Workspace

// GetName function
func (wc *WorkspaceCollection) GetName() string {
	return "workspaces"
}

// GetFields function
func (wc *WorkspaceCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(wc)
}

// GetItem function
func (wc *WorkspaceCollection) GetItem(index int) LoadableItem {
	actual := *wc
	return &actual[index]
}

// AddItem function
func (wc *WorkspaceCollection) AddItem(item LoadableItem) {
	*wc = append(*wc, *item.(*Workspace))
}

// NewItem function
func (wc *WorkspaceCollection) NewItem() LoadableItem {
	return &Workspace{}
}

// Loop function
func (wc *WorkspaceCollection) Loop(iter func(item LoadableItem) error) error {
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

package metadata

// WorkspaceCollection slice
type WorkspaceCollection []Workspace

// GetName function
func (wc *WorkspaceCollection) GetName() string {
	return "workspaces"
}

// GetFields function
func (wc *WorkspaceCollection) GetFields() []string {
	return []string{"id", "name", "appid"}
}

// UnMarshal function
func (wc *WorkspaceCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(wc, data)
}

// Marshal function
func (wc *WorkspaceCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(wc)
}

// GetItem function
func (wc *WorkspaceCollection) GetItem(index int) CollectionableItem {
	actual := *wc
	return &actual[index]
}

// Loop function
func (wc *WorkspaceCollection) Loop(iter func(item CollectionableItem) error) error {
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

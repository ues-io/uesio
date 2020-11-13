package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

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
	for _, item := range *wc {
		err := iter(&item)
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

// ByNameRequest function
func (wc *WorkspaceCollection) ByNameRequest(appName, workspaceName string) []reqs.LoadRequest {
	return []reqs.LoadRequest{
		reqs.NewPlatformLoadRequest(
			"workspacesWire",
			wc.GetName(),
			wc.GetFields(),
			[]reqs.LoadRequestCondition{
				{
					Field: "uesio.id",
					Value: appName + "_" + workspaceName,
				},
			},
		),
	}
}

package workspace

func NewKeyInfo(appName, workspaceName, workspaceID string) KeyInfo {
	return KeyInfo{
		appName:       appName,
		workspaceID:   workspaceID,
		workspaceName: workspaceName,
	}
}

type KeyInfo struct {
	appName       string
	workspaceID   string
	workspaceName string
}

func (t KeyInfo) HasAnyMissingField() bool {
	return t.appName == "" || t.workspaceName == "" || t.workspaceID == ""
}

// GetWorkspaceName returns the workspace's name, e.g. "dev"
func (t KeyInfo) GetWorkspaceName() string {
	return t.workspaceName
}

// GetWorkspaceName returns the app's fully-qualified name, e.g. "luigi/foo"
func (t KeyInfo) GetAppName() string {
	return t.appName
}

// GetWorkspaceID returns the workspace's unique id, a UUID
func (t KeyInfo) GetWorkspaceID() string {
	return t.workspaceID
}

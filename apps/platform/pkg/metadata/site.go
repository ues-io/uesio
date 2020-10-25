package metadata

// Site struct
type Site struct {
	ID         string
	Name       string
	AppRef     string
	VersionRef string
	AppVersion *AppVersion
	Workspace  *Workspace
}

// GetWorkspaceID function
func (s *Site) GetWorkspaceID() string {
	if s.Workspace != nil {
		return s.Workspace.ID
	}
	return ""
}

// GetWorkspaceApp function
func (s *Site) GetWorkspaceApp() string {
	if s.Workspace != nil {
		return s.Workspace.AppRef
	}
	return ""
}

// Seed config values (these are necessary to make things work)
var DefaultSites = SiteCollection{
	{
		Name:       "studio",
		AppRef:     "uesio",
		VersionRef: "v0.0.1",
	},
}


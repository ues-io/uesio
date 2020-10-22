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
var defaultSites = SiteCollection{
	{
		Name:       "studio",
		AppRef:     "uesio",
		VersionRef: "v0.0.1",
	},
}

// GetSite key
func GetSite(name string) (*Site, error) {
	for _, s := range defaultSites {
		if s.Name == name {
			version, err := GetAppVersion(s.AppRef, s.VersionRef)
			if err != nil {
				return nil, err
			}
			s.AppVersion = version
			return &s, nil
		}
	}
	return nil, nil
}

// GetSiteFromDomain function
func GetSiteFromDomain(domainType, domain string) (*Site, error) {
	siteDomain, err := GetDomain(domainType, domain)
	if err != nil {
		return nil, err
	}

	if siteDomain == nil {
		// Just default to the studio site
		return GetSite("studio")
	}

	return GetSite(siteDomain.Site)
}

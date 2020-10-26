package metadata

// Site struct
type Site struct {
	ID         string
	Name       string
	AppRef     string
	VersionRef string
	//BundleYaml *BundleYaml TODO:: JAS consider adding this for the site
}

// DefaultSites - Seed config values (these are necessary to make things work)
var DefaultSites = SiteCollection{
	{
		Name:       "studio",
		AppRef:     "uesio",
		VersionRef: "v0.0.1",
	},
}

package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// UserFileMetadata struct
type Site struct {
	ID         string `uesio:"uesio.id"`
	Name       string `uesio:"uesio.name"`
	BundleID   string `uesio:"uesio.bundleid"`
	AppRef     string `uesio:"uesio.appref"`
	VersionRef string `uesio:"uesio.versionref"`
}

// DefaultSites - Seed config values (these are necessary to make things work)
var DefaultSites = SiteCollection{
	{
		Name:       "studio",
		BundleID:   "uesio_v0.0.1",
		AppRef:     "uesio",
		VersionRef: "v0.0.1",
	},
}

// GetCollectionName function
func (s *Site) GetCollectionName() string {
	return s.GetCollection().GetName()
}

// GetCollection function
func (s *Site) GetCollection() CollectionableGroup {
	var sc SiteCollection
	return &sc
}

// GetConditions function
func (s *Site) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.name",
			Value: s.Name,
		},
	}, nil
}

// GetNamespace function
func (s *Site) GetNamespace() string {
	return ""
}

// SetNamespace function
func (s *Site) SetNamespace(namespace string) {
	//u.Namespace = namespace
}

// SetWorkspace function
func (s *Site) SetWorkspace(workspace string) {

}

// GetKey function
func (s *Site) GetKey() string {
	return s.ID
}

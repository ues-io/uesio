package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// SiteDomain struct
type SiteDomain struct {
	ID     string `uesio:"uesio.id"`
	Site   string `uesio:"uesio.siteid"`
	Type   string `uesio:"uesio.type"`
	Domain string `uesio:"uesio.domain"`
}

// Seed config values (these are necessary to make things work)
var DefaultSiteDomains = SiteDomainCollection{
	{
		Site:   "studio",
		Type:   "domain",
		Domain: "localhost",
	},
	{
		Site:   "studio",
		Type:   "domain",
		Domain: "uesio-dev.com",
	},
	{
		Site:   "studio",
		Type:   "domain",
		Domain: "uesio.com",
	},
	{
		Site:   "studio",
		Type:   "subdomain",
		Domain: "www",
	},
	{
		Site:   "studio",
		Type:   "subdomain",
		Domain: "studio",
	},
}

// GetCollectionName function
func (s *SiteDomain) GetCollectionName() string {
	return s.GetCollection().GetName()
}

// GetCollection function
func (s *SiteDomain) GetCollection() CollectionableGroup {
	var sc SiteCollection
	return &sc
}

// GetConditions function
func (s *SiteDomain) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.domain",
			Value: s.Domain,
		},
	}, nil
}

// GetNamespace function
func (s *SiteDomain) GetNamespace() string {
	return ""
}

// SetNamespace function
func (s *SiteDomain) SetNamespace(namespace string) {
	//u.Namespace = namespace
}

// SetWorkspace function
func (s *SiteDomain) SetWorkspace(workspace string) {

}

// GetKey function
func (s *SiteDomain) GetKey() string {
	return s.ID
}

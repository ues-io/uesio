package metadata

// SiteDomain struct
type SiteDomain struct {
	ID     string
	Site   string
	Type   string
	Domain string
}

// Seed config values (these are necessary to make things work)
var defaultSiteDomains = SiteDomainCollection{
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

// GetDomain key
func GetDomain(domainType, domain string) (*SiteDomain, error) {
	for _, sd := range defaultSiteDomains {
		if sd.Type == domainType && sd.Domain == domain {
			return &sd, nil
		}
	}
	return nil, nil
}

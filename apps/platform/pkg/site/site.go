package site

import (
	"github.com/thecloudmasters/uesio/pkg/dependencyresolver"
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

// GetSite key
func GetSite(name string) (*metadata.Site, error) {
	for _, s := range metadata.DefaultSites {
		if s.Name == name {
			version, err := dependencyresolver.GetAppVersion(s.AppRef, s.VersionRef)
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
func GetSiteFromDomain(domainType, domain string) (*metadata.Site, error) {
	siteDomain, err := metadata.GetDomain(domainType, domain)
	if err != nil {
		return nil, err
	}

	if siteDomain == nil {
		// Just default to the studio site
		return GetSite("studio")
	}

	return GetSite(siteDomain.Site)
}

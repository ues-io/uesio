package site

import (
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

// GetSite key
func GetSite(name string) (*metadata.Site, error) {
	for _, s := range metadata.DefaultSites {
		if s.Name == name {
			//TODO:: JAS - We need to store site records
			//so that we can actually fetch these -
			//and not need to depend on the DefaultSites
			//bundleYaml, err := dependencyresolver.GetAppBundle(s.AppRef, s.VersionRef)
			//if err != nil {
			//	return nil, err
			//}
			//s.BundleYaml = bundleYaml
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

package site

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/localcache"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// GetSite key
func GetSite(siteid string, session *sess.Session) (*metadata.Site, error) {
	var s metadata.Site
	err := datasource.PlatformLoadOne(
		&s,
		[]adapters.LoadRequestCondition{
			{
				Field: "uesio.id",
				Value: siteid,
			},
		},
		session,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

// GetDomain key
func getDomain(domainType, domain string, session *sess.Session) (*metadata.SiteDomain, error) {
	var sd metadata.SiteDomain
	err := datasource.PlatformLoadOne(
		&sd,
		[]adapters.LoadRequestCondition{
			{
				Field: "uesio.domain",
				Value: domain,
			},
			{
				Field: "uesio.type",
				Value: domainType,
			},
		},
		session,
	)
	if err != nil {
		return nil, err
	}
	return &sd, nil
}

// GetSiteFromDomain function
func GetSiteFromDomain(domainType, domain string) (*metadata.Site, error) {
	entry, ok := localcache.GetCacheEntry("domain-site", domainType+":"+domain)
	if ok {
		return entry.(*metadata.Site), nil
	}
	headlessSession := sess.GetHeadlessSession()
	siteDomain, err := getDomain(domainType, domain, headlessSession)
	if err != nil {
		return nil, err
	}
	if siteDomain == nil {
		return nil, errors.New("no site domain record for that host")
	}
	site, err := GetSite(siteDomain.Site, headlessSession)
	if err == nil {
		localcache.SetCacheEntry("domain-site", domainType+":"+domain, site)
		return site, nil
	}
	return site, err
}

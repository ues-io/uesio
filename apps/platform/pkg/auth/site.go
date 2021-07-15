package auth

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/localcache"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// GetSite key
func GetSite(siteid string, session *sess.Session) (*meta.Site, error) {
	var s meta.Site
	err := datasource.PlatformLoadOne(
		&s,
		[]adapt.LoadRequestCondition{
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
func getDomain(domainType, domain string, session *sess.Session) (*meta.SiteDomain, error) {
	var sd meta.SiteDomain
	err := datasource.PlatformLoadOne(
		&sd,
		[]adapt.LoadRequestCondition{
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
func GetSiteFromDomain(domainType, domain string) (*meta.Site, error) {
	entry, ok := localcache.GetCacheEntry("domain-site", domainType+":"+domain)
	if ok {
		return entry.(*meta.Site), nil
	}
	headlessSession, err := GetHeadlessSession()
	if err != nil {
		return nil, err
	}
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

func GetHeadlessSession() (*sess.Session, error) {
	site := &meta.Site{
		ID:   "prod_studio",
		Name: "prod_studio",
		Bundle: &meta.Bundle{
			AppID: "studio",
			Major: "0",
			Minor: "0",
			Patch: "1",
		},
		AppID: "studio",
	}
	bundleDef, err := bundle.GetSiteAppBundle(site)
	if err != nil {
		return nil, err
	}
	site.SetAppBundle(bundleDef)

	return sess.GetHeadlessSession(&meta.User{
		FirstName: "Guest",
		LastName:  "User",
		Profile:   "uesio.public",
	}, site), nil
}

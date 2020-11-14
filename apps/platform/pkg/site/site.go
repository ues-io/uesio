package site

import (
	"errors"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/localcache"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// GetSite key
func GetSite(siteid string, session *sess.Session) (*metadata.Site, error) {
	sc := metadata.SiteCollection{}
	err := datasource.PlatformLoad(
		[]metadata.CollectionableGroup{
			&sc,
		},
		[]reqs.LoadRequest{
			reqs.NewPlatformLoadRequest(
				"itemWire",
				sc.GetName(),
				sc.GetFields(),
				[]reqs.LoadRequestCondition{
					{
						Field: "uesio.id",
						Value: siteid,
					},
				},
			),
		},
		session,
	)
	if err != nil {
		return nil, err
	}
	if len(sc) < 1 {
		return nil, errors.New("unable!! to find matching site record for: " + siteid)
	}
	if len(sc) > 1 {
		return nil, errors.New("found multiple matching site records for: " + siteid)
	}
	return &sc[0], nil
}

// GetDomain key
func getDomain(domainType, domain string, session *sess.Session) (*metadata.SiteDomain, error) {
	sdc := metadata.SiteDomainCollection{}
	err := datasource.PlatformLoad(
		[]metadata.CollectionableGroup{
			&sdc,
		},
		[]reqs.LoadRequest{
			reqs.NewPlatformLoadRequest(
				"itemWire",
				sdc.GetName(),
				sdc.GetFields(),
				[]reqs.LoadRequestCondition{
					{
						Field: "uesio.domain",
						Value: domain,
					},
					{
						Field: "uesio.type",
						Value: domainType,
					},
				},
			),
		},
		session,
	)
	if err != nil {
		return nil, err
	}
	if len(sdc) < 1 {
		return nil, errors.New("unable to find matching site domain record for: " + domain + ", of type: " + domainType)
	}
	if len(sdc) > 1 {
		return nil, errors.New("found multiple matching site domain records for: " + domain + ", of type: " + domainType)
	}
	return &sdc[0], nil
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

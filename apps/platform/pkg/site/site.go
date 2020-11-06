//JAS:: TODO Load from Bundles the SiteDomain record.
//JAS:: TODO Load from Bundles the Site record.
//JAS:: TODO Verify no dependency cycles

package site

import (
	"errors"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// GetSite key
func GetSite(name string, session *sess.Session) (*metadata.Site, error) {
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
						Field: "uesio.name",
						Value: name,
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
		return nil, errors.New("unable to find matching site record for: " + name)
	}
	if len(sc) > 1 {
		return nil, errors.New("found multiple matching site records for: " + name)
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
func GetSiteFromDomain(domainType, domain string, session *sess.Session) (*metadata.Site, error) {
	siteDomain, err := getDomain(domainType, domain, session)
	if err != nil {
		return nil, err
	}

	if siteDomain == nil {
		// Just default to the studio site
		return GetSite("studio")
	}

	return GetSite(siteDomain.Site, session)
}

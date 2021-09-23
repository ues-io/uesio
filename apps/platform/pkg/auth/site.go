package auth

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func GetSite(siteid string, session *sess.Session) (*meta.Site, error) {
	var s meta.Site
	err := datasource.PlatformLoadOneWithFields(
		&s,
		[]adapt.LoadRequestField{
			{
				ID: "uesio.id",
			},
			{
				ID: "uesio.name",
			},
			{
				ID: "uesio.app",
			},
			{
				ID: "uesio.bundle",
				Fields: []adapt.LoadRequestField{
					{
						ID: "uesio.app",
					},
					{
						ID: "uesio.major",
					},
					{
						ID: "uesio.minor",
					},
					{
						ID: "uesio.patch",
					},
				},
			},
		},
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
	return GetSite(siteDomain.Site, headlessSession)
}

func GetHeadlessSession() (*sess.Session, error) {
	site := &meta.Site{
		ID:   "prod_studio",
		Name: "prod",
		Bundle: &meta.Bundle{
			App: &meta.App{
				ID: "studio",
			},
			Major: "0",
			Minor: "0",
			Patch: "1",
		},
		App: &meta.App{
			ID: "studio",
		},
	}
	bundleDef, err := bundle.GetSiteAppBundle(site)
	if err != nil {
		return nil, err
	}
	site.SetAppBundle(bundleDef)

	return sess.GetHeadlessSession(&meta.User{
		ID:        "system",
		FirstName: "Guest",
		LastName:  "User",
		Profile:   "uesio.public",
	}, site), nil
}

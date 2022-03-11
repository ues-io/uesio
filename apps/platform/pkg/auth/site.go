package auth

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func querySite(siteid string, session *sess.Session) (*meta.Site, error) {
	var s meta.Site
	err := datasource.PlatformLoadOne(
		&s,
		&datasource.PlatformLoadOptions{
			Fields: []adapt.LoadRequestField{
				{
					ID: "uesio.id",
				},
				{
					ID: "studio.name",
				},
				{
					ID: "studio.app",
					Fields: []adapt.LoadRequestField{
						{
							ID: "uesio.id",
						},
					},
				},
				{
					ID: "studio.bundle",
					Fields: []adapt.LoadRequestField{
						{
							ID: "studio.app",
							Fields: []adapt.LoadRequestField{
								{
									ID: "uesio.id",
								},
							},
						},
						{
							ID: "studio.major",
						},
						{
							ID: "studio.minor",
						},
						{
							ID: "studio.patch",
						},
					},
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: "uesio.id",
					Value: siteid,
				},
			},
		},
		session,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func getDomain(domainType, domain string, session *sess.Session) (*meta.SiteDomain, error) {
	var sd meta.SiteDomain
	err := datasource.PlatformLoadOne(
		&sd,
		&datasource.PlatformLoadOptions{
			Fields: []adapt.LoadRequestField{
				{
					ID: "studio.site",
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: "studio.domain",
					Value: domain,
				},
				{
					Field: "studio.type",
					Value: domainType,
				},
			},
		},
		session,
	)
	if err != nil {
		return nil, err
	}
	return &sd, nil
}

func querySiteFromDomain(domainType, domain string) (*meta.Site, error) {
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
	return querySite(siteDomain.Site, headlessSession)
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

	session := sess.NewSession(nil, &meta.User{
		ID:        "system_system",
		FirstName: "Super",
		LastName:  "Admin",
		Profile:   "uesio.public",
	}, site)

	session.SetPermissions(&meta.PermissionSet{
		AllowAllViews:       true,
		AllowAllRoutes:      true,
		AllowAllFiles:       true,
		AllowAllCollections: true,
	})

	return session, nil
}

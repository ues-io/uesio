package auth

import (
	"errors"
	"fmt"

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
					ID: adapt.ID_FIELD,
				},
				{
					ID: "uesio/studio.name",
				},
				{
					ID: "uesio/studio.app",
					Fields: []adapt.LoadRequestField{
						{
							ID: adapt.ID_FIELD,
						},
					},
				},
				{
					ID: "uesio/studio.bundle",
					Fields: []adapt.LoadRequestField{
						{
							ID: "uesio/studio.app",
							Fields: []adapt.LoadRequestField{
								{
									ID: adapt.ID_FIELD,
								},
							},
						},
						{
							ID: "uesio/studio.major",
						},
						{
							ID: "uesio/studio.minor",
						},
						{
							ID: "uesio/studio.patch",
						},
					},
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: adapt.ID_FIELD,
					Value: siteid,
				},
			},
		},
		session,
	)
	if err != nil {
		fmt.Println("Faillll hrrrrrr: " + siteid)
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
					ID: "uesio/studio.site",
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: "uesio/studio.domain",
					Value: domain,
				},
				{
					Field: "uesio/studio.type",
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
	headlessSession, err := GetStudioAdminSession()
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
	return querySite(siteDomain.Site.ID, headlessSession)
}

func GetStudioAdminSession() (*sess.Session, error) {
	site := &meta.Site{
		ID:   "uesio/studio_prod",
		Name: "prod",
		Bundle: &meta.Bundle{
			App: &meta.App{
				ID: "uesio/studio",
			},
			Major: 0,
			Minor: 0,
			Patch: 1,
		},
		App: &meta.App{
			ID: "uesio/studio",
		},
	}
	bundleDef, err := bundle.GetSiteAppBundle(site)
	if err != nil {
		return nil, err
	}
	site.SetAppBundle(bundleDef)

	session := sess.NewSession(nil, &meta.User{
		ID:        "uesio",
		FirstName: "Super",
		LastName:  "Admin",
		Profile:   "uesio/core.public",
	}, site)

	session.SetPermissions(&meta.PermissionSet{
		AllowAllViews:       true,
		AllowAllRoutes:      true,
		AllowAllFiles:       true,
		AllowAllCollections: true,
	})

	return session, nil
}

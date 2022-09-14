package auth

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

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
	return datasource.QuerySiteByID(siteDomain.Site.ID, headlessSession)
}

func GetStudioSite() (*meta.Site, error) {
	app := &meta.App{
		UniqueKey: "uesio/studio",
	}
	site := &meta.Site{
		UniqueKey: "uesio/studio:prod",
		Name:      "prod",
		Bundle: &meta.Bundle{
			App:   app,
			Major: 0,
			Minor: 0,
			Patch: 1,
		},
		App: app,
	}
	bundleDef, err := bundle.GetSiteAppBundle(site)
	if err != nil {
		return nil, err
	}
	site.SetAppBundle(bundleDef)
	return site, nil
}

func GetStudioAnonSession() (*sess.Session, error) {
	site, err := GetStudioSite()
	if err != nil {
		return nil, err
	}

	//This is only used to query the system user the first time
	var BOOT_USER = &meta.User{
		Username:  "boot",
		FirstName: "Boot",
		LastName:  "User",
	}

	session := sess.NewSession(nil, BOOT_USER, site)

	session.SetPermissions(&meta.PermissionSet{
		AllowAllViews:       true,
		AllowAllRoutes:      true,
		AllowAllFiles:       true,
		AllowAllCollections: true,
	})

	return session, nil
}

func GetStudioAdminSession() (*sess.Session, error) {

	site, err := GetStudioSite()
	if err != nil {
		return nil, err
	}

	session := sess.NewSession(nil, sess.SYSTEM_USER, site)

	session.SetPermissions(&meta.PermissionSet{
		AllowAllViews:       true,
		AllowAllRoutes:      true,
		AllowAllFiles:       true,
		AllowAllCollections: true,
	})

	return session, nil
}

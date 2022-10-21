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
	session, err := GetStudioAnonSession()
	if err != nil {
		return nil, err
	}
	siteDomain, err := getDomain(domainType, domain, session)
	if err != nil {
		return nil, err
	}
	if siteDomain == nil {
		return nil, errors.New("no site domain record for that host")
	}
	return datasource.QuerySiteByID(siteDomain.Site.ID, session, nil)
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

func GetAnonSession(site *meta.Site) *sess.Session {

	session := sess.NewSession(nil, &meta.User{
		Username:  "boot",
		FirstName: "Boot",
		LastName:  "User",
	}, site)

	session.SetPermissions(&meta.PermissionSet{
		AllowAllCollections: true,
		ViewAllRecords:      true,
	})

	return session
}

func GetStudioAnonSession() (*sess.Session, error) {
	site, err := GetStudioSite()
	if err != nil {
		return nil, err
	}
	return GetAnonSession(site), nil
}

func GetPublicUser(site *meta.Site, connection adapt.Connection) (*meta.User, error) {
	return GetUserByKey("guest", GetAnonSession(site), connection)
}

func GetSystemUser(site *meta.Site, connection adapt.Connection) (*meta.User, error) {
	return GetUserByKey("system", GetAnonSession(site), connection)
}

func GetStudioSystemUser(connection adapt.Connection) (*meta.User, error) {
	site, err := GetStudioSite()
	if err != nil {
		return nil, err
	}
	return GetSystemUser(site, connection)
}

func GetSystemSession(site *meta.Site, connection adapt.Connection) (*sess.Session, error) {
	user, err := GetSystemUser(site, connection)
	if err != nil {
		return nil, err
	}
	session := sess.NewSession(nil, user, site)
	session.SetPermissions(&meta.PermissionSet{
		AllowAllCollections: true,
		ViewAllRecords:      true,
		ModifyAllRecords:    true,
		NamedRefs: map[string]bool{
			"uesio/studio.workspace_admin": true,
		},
	})
	return session, nil
}

func GetStudioSystemSession(connection adapt.Connection) (*sess.Session, error) {
	site, err := GetStudioSite()
	if err != nil {
		return nil, err
	}
	return GetSystemSession(site, connection)
}

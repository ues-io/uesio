package auth

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getDomain(domainType, domain string) (*meta.SiteDomain, error) {
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
		sess.GetStudioAnonSession(),
	)
	if err != nil {
		return nil, err
	}
	return &sd, nil
}

func querySiteFromDomain(domainType, domain string) (*meta.Site, error) {
	siteDomain, err := getDomain(domainType, domain)
	if err != nil {
		return nil, err
	}
	if siteDomain == nil {
		return nil, errors.New("no site domain record for that host")
	}
	return datasource.QuerySiteByID(siteDomain.Site.ID, nil)
}

func GetSystemSessionByKey(siteKey string, connection adapt.Connection) (*sess.Session, error) {
	site, err := datasource.QuerySiteByKey(siteKey, connection)
	if err != nil {
		return nil, err
	}
	bundleDef, err := bundle.GetSiteAppBundle(site)
	if err != nil {
		return nil, err
	}

	site.SetAppBundle(bundleDef)
	return GetSystemSession(site, connection)
}

func GetPublicUser(site *meta.Site, connection adapt.Connection) (*meta.User, error) {
	return GetUserByKey("guest", sess.GetAnonSession(site), connection)
}

func GetSystemUser(site *meta.Site, connection adapt.Connection) (*meta.User, error) {
	return GetUserByKey("system", sess.GetAnonSession(site), connection)
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
	})
	return session, nil
}

func GetStudioSystemSession(connection adapt.Connection) (*sess.Session, error) {
	return GetSystemSession(sess.GetStudioSite(), connection)
}

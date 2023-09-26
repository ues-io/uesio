package auth

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
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
			ServerInitiated: true,
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
	return datasource.QuerySiteByID(siteDomain.Site.ID, sess.GetStudioAnonSession(), nil)
}

func GetPublicUser(site *meta.Site, connection adapt.Connection) (*meta.User, error) {
	if site == nil {
		return nil, errors.New("No Site Provided")
	}
	return GetUserByKey("guest", sess.GetAnonSession(site), connection)
}

func GetSystemUser(site *meta.Site, connection adapt.Connection) (*meta.User, error) {
	if site == nil {
		return nil, errors.New("No Site Provided")
	}
	return GetUserByKey("system", sess.GetAnonSession(site), connection)
}

func GetSystemSession(site *meta.Site, connection adapt.Connection) (*sess.Session, error) {
	user, err := GetSystemUser(site, connection)
	if err != nil {
		return nil, err
	}

	user.Permissions = meta.GetAdminPermissionSet()
	session := sess.New("", user, site)

	return session, nil
}

func GetStudioSystemSession(connection adapt.Connection) (*sess.Session, error) {
	return GetSystemSession(sess.GetStudioSite(), connection)
}

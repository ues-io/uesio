package auth

import (
	"context"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

// In the future, we could improve this to take an environment variable.
// That way we could have instances of uesio that just serve a single site.
var defaultSite = "uesio/studio:prod"

func getDomain(domainType, domain string) (*meta.SiteDomain, error) {
	var sd meta.SiteDomain
	err := datasource.PlatformLoadOne(
		&sd,
		&datasource.PlatformLoadOptions{
			Fields: []wire.LoadRequestField{
				{
					ID: "uesio/studio.site",
				},
			},
			Conditions: []wire.LoadRequestCondition{
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
		sess.GetStudioAnonSession(context.Background()),
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
	return datasource.QuerySiteByID(siteDomain.Site.ID, sess.GetStudioAnonSession(context.Background()), nil)
}

func GetPublicUser(site *meta.Site, connection wire.Connection) (*meta.User, error) {
	if site == nil {
		return nil, errors.New("No Site Provided")
	}
	return GetUserByKey("guest", sess.GetAnonSession(context.Background(), site), connection)
}

func GetPublicSession(site *meta.Site, connection wire.Connection) (*sess.Session, error) {
	publicUser, err := GetPublicUser(site, connection)
	if err != nil {
		return nil, err
	}
	return GetSessionFromUser("", publicUser, site)
}

func GetSystemUser(site *meta.Site, connection wire.Connection) (*meta.User, error) {
	if site == nil {
		return nil, errors.New("No Site Provided")
	}
	return GetUserByKey("system", sess.GetAnonSession(context.Background(), site), connection)
}

func GetSystemSession(ctx context.Context, site *meta.Site, connection wire.Connection) (*sess.Session, error) {
	user, err := GetSystemUser(site, connection)
	if err != nil {
		return nil, err
	}

	user.Permissions = meta.GetAdminPermissionSet()
	session := sess.New("", user, site)
	session.SetGoContext(ctx)
	return session, nil
}

func GetStudioSystemSession(ctx context.Context, connection wire.Connection) (*sess.Session, error) {
	return GetSystemSession(ctx, sess.GetStudioSite(), connection)
}

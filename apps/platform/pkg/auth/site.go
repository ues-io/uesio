package auth

import (
	"context"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func getDomain(ctx context.Context, domainType, domain string) (*meta.SiteDomain, error) {
	var sd meta.SiteDomain
	err := datasource.PlatformLoadOne(
		ctx,
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
		sess.GetStudioAnonSession(),
	)
	if err != nil {
		return nil, err
	}
	return &sd, nil
}

func querySiteFromDomain(ctx context.Context, domainType, domain string) (*meta.Site, error) {
	siteDomain, err := getDomain(ctx, domainType, domain)
	if err != nil {
		return nil, err
	}
	if siteDomain == nil {
		return nil, errors.New("no site domain record for that host")
	}
	return datasource.QuerySiteByID(ctx, siteDomain.Site.ID, sess.GetStudioAnonSession(), nil)
}

func GetPublicUser(ctx context.Context, site *meta.Site, connection wire.Connection) (*meta.User, error) {
	if site == nil {
		return nil, errors.New("no site provided")
	}
	return GetUserByKey(ctx, meta.PublicUsername, sess.GetAnonSession(site), connection)
}

func GetPublicSession(ctx context.Context, site *meta.Site, connection wire.Connection) (*sess.Session, error) {
	publicUser, err := GetPublicUser(ctx, site, connection)
	if err != nil {
		return nil, err
	}
	return GetSessionFromUser(ctx, publicUser, site, "")
}

func GetSystemUser(ctx context.Context, site *meta.Site, connection wire.Connection) (*meta.User, error) {
	if site == nil {
		return nil, errors.New("no site provided")
	}
	return GetUserByKey(ctx, meta.SystemUsername, sess.GetAnonSession(site), connection)
}

func GetSystemSession(ctx context.Context, site *meta.Site, connection wire.Connection) (*sess.Session, error) {
	user, err := GetSystemUser(ctx, site, connection)
	if err != nil {
		return nil, err
	}

	user.Permissions = meta.GetAdminPermissionSet()
	session := sess.New(user, site)
	return session, nil
}

func GetStudioSystemSession(ctx context.Context, connection wire.Connection) (*sess.Session, error) {
	return GetSystemSession(ctx, sess.GetStudioSite(), connection)
}

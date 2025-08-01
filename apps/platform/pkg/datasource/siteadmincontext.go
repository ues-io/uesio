package datasource

import (
	"context"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func getSiteAdminUser() *meta.User {
	return &meta.User{
		BuiltIn: meta.BuiltIn{
			UniqueKey: meta.SystemUsername,
		},
		Permissions: meta.GetAdminPermissionSet(),
	}
}

func GetSiteAdminSession(currentSession *sess.Session) *sess.Session {
	// If we're in a workspace context, just upgrade the permissions
	if currentSession.GetWorkspaceSession() != nil {
		newSession := *currentSession
		newSession.SetWorkspaceSession(sess.NewWorkspaceSession(
			currentSession.GetWorkspace(),
			currentSession.GetSiteUser(),
			"uesio/system.admin",
			meta.GetAdminPermissionSet(),
		))
		return &newSession
	}
	// If we are already in site admin context, we don't need to do anything.
	if currentSession.GetSiteAdmin() != nil {
		return currentSession
	}

	newSession := *currentSession
	newSession.SetSiteAdminSession(sess.NewSiteSession(
		currentSession.GetSite(),
		getSiteAdminUser(),
	))
	return &newSession
}

func addSiteAdminContext(ctx context.Context, siteadmin *meta.Site, session *sess.Session, connection wire.Connection) error {
	site := session.GetSite()
	perms := session.GetSitePermissions()

	// 1. Make sure we're in a site that can read/modify workspaces
	if site.GetAppFullName() != "uesio/studio" {
		return errors.New("this site does not allow administering other sites")
	}
	// 2. we should have a profile that allows modifying workspaces
	if !perms.HasNamedPermission(constant.WorkspaceAdminPerm) {
		return errors.New("your profile does not allow you to administer sites")
	}

	siteadmin.Domain = site.Domain
	siteadmin.Subdomain = site.Subdomain
	siteadmin.Scheme = site.Scheme

	if siteadmin.Bundle == nil {
		return errors.New("no Bundle found for site to administer")
	}

	session.SetSiteAdminSession(sess.NewSiteSession(
		siteadmin,
		getSiteAdminUser(),
	))

	bundleDef, err := bundle.GetSiteBundleDef(ctx, siteadmin, connection)
	if err != nil {
		return err
	}

	licenseMap, err := GetLicenses(ctx, siteadmin.GetAppFullName(), connection)
	if err != nil {
		return err
	}
	bundleDef.Licenses = licenseMap

	siteadmin.SetAppBundle(bundleDef)

	return nil
}

func AddSiteAdminContextByID(ctx context.Context, siteID string, session *sess.Session, connection wire.Connection) (*sess.Session, error) {
	sessClone := session.RemoveWorkspaceContext()
	siteadmin, err := QuerySiteByID(ctx, siteID, sessClone, connection)
	if err != nil {
		return nil, err
	}
	return sessClone, addSiteAdminContext(ctx, siteadmin, sessClone, connection)
}

func AddSiteAdminContextByKey(ctx context.Context, siteKey string, session *sess.Session, connection wire.Connection) (*sess.Session, error) {
	sessClone := session.RemoveWorkspaceContext()
	siteadmin, err := QuerySiteByKey(ctx, siteKey, sessClone, connection)
	if err != nil {
		return nil, err
	}
	return sessClone, addSiteAdminContext(ctx, siteadmin, sessClone, connection)
}

func QuerySiteByID(ctx context.Context, siteid string, session *sess.Session, connection wire.Connection) (*meta.Site, error) {
	return querySite(ctx, siteid, commonfields.Id, session, connection)
}

func QuerySiteByKey(ctx context.Context, sitekey string, session *sess.Session, connection wire.Connection) (*meta.Site, error) {
	return querySite(ctx, sitekey, commonfields.UniqueKey, session, connection)
}

func querySite(ctx context.Context, value, field string, session *sess.Session, connection wire.Connection) (*meta.Site, error) {

	var s meta.Site
	err := PlatformLoadOne(
		ctx,
		&s,
		&PlatformLoadOptions{
			Connection: connection,
			Fields: []wire.LoadRequestField{
				{
					ID: commonfields.Id,
				},
				{
					ID: commonfields.UniqueKey,
				},
				{
					ID: "uesio/studio.name",
				},
				{
					ID: "uesio/studio.title",
				},
				{
					ID: "uesio/studio.enable_seo",
				},
				{
					ID: "uesio/studio.app",
					Fields: []wire.LoadRequestField{
						{
							ID: commonfields.Id,
						},
						{
							ID: commonfields.UniqueKey,
						},
					},
				},
				{
					ID: "uesio/studio.bundle",
					Fields: []wire.LoadRequestField{
						{
							ID: "uesio/studio.app",
							Fields: []wire.LoadRequestField{
								{
									ID: commonfields.Id,
								},
								{
									ID: commonfields.UniqueKey,
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
			Conditions: []wire.LoadRequestCondition{
				{
					Field: field,
					Value: value,
				},
			},
			RequireWriteAccess: true,
		},
		session,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

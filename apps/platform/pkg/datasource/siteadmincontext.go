package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getSiteAdminUser() *meta.User {
	return &meta.User{
		BuiltIn: meta.BuiltIn{
			UniqueKey: "system",
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

func addSiteAdminContext(siteadmin *meta.Site, session *sess.Session, connection adapt.Connection) error {
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

	if siteadmin.Bundle == nil {
		return errors.New("no Bundle found for site to administer")
	}

	session.SetSiteAdminSession(sess.NewSiteSession(
		siteadmin,
		getSiteAdminUser(),
	))

	bundleDef, err := bundle.GetSiteBundleDef(siteadmin, connection)
	if err != nil {
		return err
	}

	licenseMap, err := GetLicenses(siteadmin.GetAppFullName(), connection)
	if err != nil {
		return err
	}
	bundleDef.Licenses = licenseMap

	siteadmin.SetAppBundle(bundleDef)

	return nil
}

func AddSiteAdminContextByID(siteID string, session *sess.Session, connection adapt.Connection) (*sess.Session, error) {
	sessClone := session.RemoveWorkspaceContext()
	siteadmin, err := QuerySiteByID(siteID, sessClone, connection)
	if err != nil {
		return nil, err
	}
	return sessClone, addSiteAdminContext(siteadmin, sessClone, connection)
}

func AddSiteAdminContextByKey(siteKey string, session *sess.Session, connection adapt.Connection) (*sess.Session, error) {
	sessClone := session.RemoveWorkspaceContext()
	siteadmin, err := QuerySiteByKey(siteKey, sessClone, connection)
	if err != nil {
		return nil, err
	}
	return sessClone, addSiteAdminContext(siteadmin, sessClone, connection)
}

func QuerySiteByID(siteid string, session *sess.Session, connection adapt.Connection) (*meta.Site, error) {
	return querySite(siteid, adapt.ID_FIELD, session, connection)
}

func QuerySiteByKey(sitekey string, session *sess.Session, connection adapt.Connection) (*meta.Site, error) {
	return querySite(sitekey, adapt.UNIQUE_KEY_FIELD, session, connection)
}

func querySite(value, field string, session *sess.Session, connection adapt.Connection) (*meta.Site, error) {

	var s meta.Site
	err := PlatformLoadOne(
		&s,
		&PlatformLoadOptions{
			Connection: connection,
			Fields: []adapt.LoadRequestField{
				{
					ID: adapt.ID_FIELD,
				},
				{
					ID: adapt.UNIQUE_KEY_FIELD,
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
					Fields: []adapt.LoadRequestField{
						{
							ID: adapt.ID_FIELD,
						},
						{
							ID: adapt.UNIQUE_KEY_FIELD,
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
								{
									ID: adapt.UNIQUE_KEY_FIELD,
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

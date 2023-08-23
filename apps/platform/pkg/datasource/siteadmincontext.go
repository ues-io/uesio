package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Returns a permissionset that has the maximum permissions possible
func GetAdminPermissionSet() *meta.PermissionSet {
	return &meta.PermissionSet{
		AllowAllViews:       true,
		AllowAllRoutes:      true,
		AllowAllFiles:       true,
		AllowAllCollections: true,
		ModifyAllRecords:    true,
		ViewAllRecords:      true,
	}
}

func GetSiteAdminSession(currentSession *sess.Session) *sess.Session {
	// If we're in a workspace context, just upgrade the permissions
	if currentSession.GetWorkspace() != nil {
		workspaceSession := currentSession.Clone()
		workspaceSession.GetWorkspace().Permissions = GetAdminPermissionSet()
		return workspaceSession
	}
	// If we are already in site admin context, we don't need to do anything.
	if currentSession.GetSiteAdmin() != nil {
		return currentSession
	}

	siteAdminSession := currentSession.Clone()

	adminSite := currentSession.GetSite().Clone()

	upgradeToSiteAdmin(adminSite, siteAdminSession)

	return siteAdminSession

}

func upgradeToSiteAdmin(adminSite *meta.Site, adminSession *sess.Session) {
	adminSite.Permissions = GetAdminPermissionSet()

	adminSession.SetSiteAdmin(adminSite)

	adminSession.SetUser(&meta.User{
		BuiltIn: meta.BuiltIn{
			UniqueKey: "system",
		},
	})
}

func addSiteAdminContext(siteadmin *meta.Site, session *sess.Session, connection adapt.Connection) error {
	site := session.GetSite()
	perms := session.GetPermissions()

	// 1. Make sure we're in a site that can read/modify workspaces
	if site.GetAppFullName() != "uesio/studio" {
		return errors.New("this site does not allow administering other sites")
	}
	// 2. we should have a profile that allows modifying workspaces
	if !perms.HasPermission(&meta.PermissionSet{
		NamedRefs: map[string]bool{
			"uesio/studio.workspace_admin": true,
		},
	}) {
		return errors.New("your profile does not allow you to administer sites")
	}

	siteadmin.Domain = site.Domain
	siteadmin.Subdomain = site.Subdomain

	if siteadmin.Bundle == nil {
		return errors.New("no Bundle found for site to administer")
	}

	upgradeToSiteAdmin(siteadmin, session)

	bundleDef, err := bundle.GetAppBundle(session, connection)
	if err != nil {
		return err
	}

	session.GetSiteAdmin().SetAppBundle(bundleDef)
	return nil
}

func AddSiteAdminContextByID(siteID string, session *sess.Session, connection adapt.Connection) error {
	siteadmin, err := QuerySiteByID(siteID, session, connection)
	if err != nil {
		return err
	}
	return addSiteAdminContext(siteadmin, session, connection)
}

func AddSiteAdminContextByKey(siteKey string, session *sess.Session, connection adapt.Connection) error {
	siteadmin, err := QuerySiteByKey(siteKey, session, connection)
	if err != nil {
		return err
	}
	return addSiteAdminContext(siteadmin, session, connection)
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

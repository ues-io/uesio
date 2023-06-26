package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func GetSiteAdminSession(currentSession *sess.Session) *sess.Session {
	if currentSession.GetWorkspace() != nil {
		return currentSession
	}
	//This creates a copy of the session
	siteAdminSession := currentSession.RemoveWorkspaceContext()

	adminSite := currentSession.GetSite().Clone()

	upgradeToSiteAdmin(adminSite, siteAdminSession)

	return siteAdminSession

}

func upgradeToSiteAdmin(adminSite *meta.Site, adminSession *sess.Session) {
	adminSite.Permissions = &meta.PermissionSet{
		AllowAllViews:       true,
		AllowAllRoutes:      true,
		AllowAllFiles:       true,
		AllowAllCollections: true,
		ModifyAllRecords:    true,
		ViewAllRecords:      true,
	}

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
		return errors.New("No Bundle found for site to administer")
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
	siteadmin, err := QuerySiteByID(siteID, connection)
	if err != nil {
		return err
	}
	return addSiteAdminContext(siteadmin, session, connection)
}

func AddSiteAdminContextByKey(siteKey string, session *sess.Session, connection adapt.Connection) error {
	siteadmin, err := QuerySiteByKey(siteKey, connection)
	if err != nil {
		return err
	}
	return addSiteAdminContext(siteadmin, session, connection)
}

func QuerySiteByID(siteid string, connection adapt.Connection) (*meta.Site, error) {
	return querySite(siteid, adapt.ID_FIELD, connection)
}

func QuerySiteByKey(sitekey string, connection adapt.Connection) (*meta.Site, error) {
	return querySite(sitekey, adapt.UNIQUE_KEY_FIELD, connection)
}

func querySite(value, field string, connection adapt.Connection) (*meta.Site, error) {

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
		},
		sess.GetStudioAnonSession(),
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func AddSiteAdminContextByKey(siteKey string, session *sess.Session, connection adapt.Connection) error {
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

	// Get the Site from the DB
	siteadmin, err := QuerySiteByKey(siteKey, session)
	if err != nil {
		return err
	}

	// For now give siteadmin users access to everything.
	// Get the siteadmin permissions and set them on the session
	siteadmin.Permissions = &meta.PermissionSet{
		AllowAllViews:       true,
		AllowAllRoutes:      true,
		AllowAllFiles:       true,
		AllowAllCollections: true,
		ModifyAllRecords:    true,
		ViewAllRecords:      true,
	}

	if siteadmin.Bundle == nil {
		return errors.New("No Bundle found for site to administer")
	}

	session.SetSiteAdmin(siteadmin)

	bundleDef, err := bundle.GetAppBundle(session, nil)
	if err != nil {
		return err
	}

	session.GetSiteAdmin().SetAppBundle(bundleDef)
	return nil
}

func QuerySiteByID(siteid string, session *sess.Session) (*meta.Site, error) {
	return querySite(siteid, adapt.ID_FIELD, session)
}

func QuerySiteByKey(sitekey string, session *sess.Session) (*meta.Site, error) {
	return querySite(sitekey, adapt.UNIQUE_KEY_FIELD, session)
}

func querySite(value, field string, session *sess.Session) (*meta.Site, error) {
	var s meta.Site
	err := PlatformLoadOne(
		&s,
		&PlatformLoadOptions{
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
			SkipRecordSecurity: true,
		},
		session,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

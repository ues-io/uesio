package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func addAppAdminContext(appadmin *meta.App, session *sess.Session, connection adapt.Connection) error {
	// site := session.GetSite()
	// perms := session.GetPermissions()

	// // 1. Make sure we're in a site that can read/modify workspaces
	// if site.GetAppFullName() != "uesio/studio" {
	// 	return errors.New("this site does not allow administering other sites")
	// }
	// // 2. we should have a profile that allows modifying workspaces
	// if !perms.HasPermission(&meta.PermissionSet{
	// 	NamedRefs: map[string]bool{
	// 		"uesio/studio.workspace_admin": true,
	// 	},
	// }) {
	// 	return errors.New("your profile does not allow you to administer sites")
	// }

	// // For now give siteadmin users access to everything.
	// // Get the siteadmin permissions and set them on the session
	// siteadmin.Permissions = &meta.PermissionSet{
	// 	AllowAllViews:       true,
	// 	AllowAllRoutes:      true,
	// 	AllowAllFiles:       true,
	// 	AllowAllCollections: true,
	// 	ModifyAllRecords:    true,
	// 	ViewAllRecords:      true,
	// }

	// if siteadmin.Bundle == nil {
	// 	return errors.New("No Bundle found for site to administer")
	// }

	session.SetAppAdmin(appadmin)

	// bundleDef, err := bundle.GetAppBundle(session, nil)
	// if err != nil {
	// 	return err
	// }

	// session.SetUser(&meta.User{
	// 	UniqueKey: "system",
	// })

	// session.GetSiteAdmin().SetAppBundle(bundleDef)
	return nil
}

// func AddSiteAdminContextByID(siteID string, session *sess.Session, connection adapt.Connection) error {
// 	siteadmin, err := QuerySiteByID(siteID, connection)
// 	if err != nil {
// 		return err
// 	}
// 	return addSiteAdminContext(siteadmin, session, connection)
// }

func AddAppAdminContextByKey(appKey string, session *sess.Session, connection adapt.Connection) error {
	appadmin, err := QueryAppByKey(appKey, connection)
	if err != nil {
		return err
	}
	return addAppAdminContext(appadmin, session, connection)
}

// func QuerySiteByID(siteid string, connection adapt.Connection) (*meta.Site, error) {
// 	return querySite(siteid, adapt.ID_FIELD, connection)
// }

func QueryAppByKey(sitekey string, connection adapt.Connection) (*meta.App, error) {
	return queryApp(sitekey, adapt.UNIQUE_KEY_FIELD, connection)
}

func queryApp(value, field string, connection adapt.Connection) (*meta.App, error) {

	var a meta.App
	err := PlatformLoadOne(
		&a,
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
				// {
				// 	ID: "uesio/studio.app",
				// 	Fields: []adapt.LoadRequestField{
				// 		{
				// 			ID: adapt.ID_FIELD,
				// 		},
				// 		{
				// 			ID: adapt.UNIQUE_KEY_FIELD,
				// 		},
				// 	},
				// },
				// {
				// 	ID: "uesio/studio.bundle",
				// 	Fields: []adapt.LoadRequestField{
				// 		{
				// 			ID: "uesio/studio.app",
				// 			Fields: []adapt.LoadRequestField{
				// 				{
				// 					ID: adapt.ID_FIELD,
				// 				},
				// 				{
				// 					ID: adapt.UNIQUE_KEY_FIELD,
				// 				},
				// 			},
				// 		},
				// 		{
				// 			ID: "uesio/studio.major",
				// 		},
				// 		{
				// 			ID: "uesio/studio.minor",
				// 		},
				// 		{
				// 			ID: "uesio/studio.patch",
				// 		},
				// 	},
				// },
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
	return &a, nil
}

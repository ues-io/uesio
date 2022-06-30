package auth

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func AddSiteAdminContext(appName, siteName string, session *sess.Session) error {

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
	siteadmin, err := querySiteByKey(appName+":"+siteName, session)
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

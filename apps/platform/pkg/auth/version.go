package auth

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func AddVersionContext(appName, versionName string, session *sess.Session) error {

	site := session.GetSite()
	perms := session.GetPermissions()

	// 1. Make sure we're in a site that can work with metadata
	if site.GetAppID() != "studio" {
		return errors.New("this site does not allow working with versions")
	}
	// 2. we should have a profile that allows modifying workspaces
	if !perms.HasPermission(&meta.PermissionSet{
		NamedRefs: map[string]bool{
			"workspace_admin": true,
		},
	}) {
		return errors.New("your profile does not allow you to work with versions")
	}

	session.AddVersionContext(&sess.VersionInfo{
		App:     appName,
		Version: versionName,
	})
	return nil

}

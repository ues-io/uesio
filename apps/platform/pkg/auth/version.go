package auth

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func AddVersionContext(app, namespace, version string, session *sess.Session) error {

	site := session.GetSite()
	perms := session.GetSitePermissions()

	// 1. Make sure we're in a site that can work with metadata
	if site.GetAppFullName() != "uesio/studio" {
		return errors.New("this site does not allow working with versions")
	}
	// 2. we should have a profile that allows modifying workspaces
	if !perms.HasPermission(&meta.PermissionSet{
		NamedRefs: map[string]bool{
			"uesio/studio.workspace_admin": true,
		},
	}) {
		return errors.New("your profile does not allow you to work with versions")
	}

	session.AddVersionContext(&sess.VersionInfo{
		App:       app,
		Namespace: namespace,
		Version:   version,
	})
	return nil

}

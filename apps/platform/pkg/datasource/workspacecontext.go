package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func AddWorkspaceContext(appName, workspaceName string, session *sess.Session) error {

	site := session.GetSite()
	perms := session.GetPermissions()

	// 1. Make sure we're in a site that can read/modify workspaces
	if site.GetAppID() != "uesio/studio" {
		return errors.New("this site does not allow working with workspaces")
	}
	// 2. we should have a profile that allows modifying workspaces
	if !perms.HasPermission(&meta.PermissionSet{
		NamedRefs: map[string]bool{
			"uesio/studio.workspace_admin": true,
		},
	}) {
		return errors.New("your profile does not allow you to work with workspaces")
	}

	workspace := &meta.Workspace{
		ID:   appName + "_" + workspaceName,
		Name: workspaceName,
		App: &meta.App{
			ID:   appName,
			Name: appName,
		},
		// Get the workspace permissions and set them on the session
		// For now give workspace users access to everything.
		Permissions: &meta.PermissionSet{
			AllowAllViews:       true,
			AllowAllRoutes:      true,
			AllowAllFiles:       true,
			AllowAllCollections: true,
		},
	}

	session.AddWorkspaceContext(workspace)

	bundleDef, err := bundle.GetAppBundle(session)
	if err != nil {
		return err
	}

	workspace.SetAppBundle(bundleDef)
	return nil

}

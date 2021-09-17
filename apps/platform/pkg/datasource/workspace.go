package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func AddContextWorkspace(appName, workspaceName string, session *sess.Session) error {
	var workspace meta.Workspace
	err := PlatformLoadOne(
		&workspace,
		[]adapt.LoadRequestCondition{
			{
				Field: "studio.id",
				Value: appName + "_" + workspaceName,
			},
		},
		session,
	)
	if err != nil {
		return err
	}

	site := session.GetSite()
	perms := session.GetPermissions()

	// 1. Make sure we're in a site that can read/modify workspaces
	if site.App.ID != "studio" {
		return errors.New("this site does not allow working with workspaces")
	}
	// 2. we should have a profile that allows modifying workspaces
	if !perms.HasPermission(&meta.PermissionSet{
		NamedRefs: map[string]bool{
			"workspace_admin": true,
		},
	}) {
		return errors.New("your profile does not allow you to work with workspaces")
	}

	// Get the workspace permissions and set them on the session
	// For now give workspace users access to everything.
	adminPerms := &meta.PermissionSet{
		AllowAllViews:  true,
		AllowAllRoutes: true,
		AllowAllFiles:  true,
	}

	workspace.Permissions = adminPerms

	session.AddWorkspaceContext(&workspace)

	bundleDef, err := bundle.GetAppBundle(session)
	if err != nil {
		return err
	}

	session.GetWorkspace().SetAppBundle(bundleDef)
	return nil
}

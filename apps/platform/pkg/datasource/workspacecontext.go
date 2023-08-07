package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func addWorkspaceContext(workspace *meta.Workspace, session *sess.Session, connection adapt.Connection) error {
	site := session.GetSite()
	perms := session.GetPermissions()

	// 1. Make sure we're in a site that can read/modify workspaces
	if site.GetAppFullName() != "uesio/studio" {
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
	// 3. we should have edit access to the app related with the site
	var app meta.App
	err := PlatformLoadOne(
		&app,
		&PlatformLoadOptions{
			RequireWriteAccess: true,
			Fields: []adapt.LoadRequestField{
				{
					ID: adapt.ID_FIELD,
				},
				{
					ID: adapt.UNIQUE_KEY_FIELD,
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: adapt.ID_FIELD,
					Value: workspace.App.ID,
				},
			},
		},
		session,
	)
	if err != nil {
		return errors.New("your profile does not allow you to administer the app: " + workspace.App.UniqueKey)
	}

	workspace.Permissions = &meta.PermissionSet{
		AllowAllViews:       true,
		AllowAllRoutes:      true,
		AllowAllFiles:       true,
		AllowAllCollections: true,
	}

	session.AddWorkspaceContext(workspace)

	bundleDef, err := bundle.GetAppBundle(session, connection)
	if err != nil {
		return err
	}

	workspace.SetAppBundle(bundleDef)
	return nil
}

func AddWorkspaceContextByKey(workspaceKey string, session *sess.Session, connection adapt.Connection) error {
	var workspace meta.Workspace
	err := PlatformLoadOne(
		&workspace,
		&PlatformLoadOptions{
			Connection: connection,
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: adapt.UNIQUE_KEY_FIELD,
					Value: workspaceKey,
				},
			},
		},
		session.RemoveWorkspaceContext(),
	)
	if err != nil {
		return err
	}
	return addWorkspaceContext(&workspace, session, connection)
}

func AddWorkspaceContextByID(workspaceID string, session *sess.Session, connection adapt.Connection) error {
	var workspace meta.Workspace
	err := PlatformLoadOne(
		&workspace,
		&PlatformLoadOptions{
			Connection: connection,
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: adapt.ID_FIELD,
					Value: workspaceID,
				},
			},
		},
		session.RemoveWorkspaceContext(),
	)
	if err != nil {
		return err
	}
	return addWorkspaceContext(&workspace, session, connection)
}

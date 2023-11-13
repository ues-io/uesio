package datasource

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func addWorkspaceContext(workspace *meta.Workspace, session *sess.Session, connection adapt.Connection) error {
	site := session.GetSite()
	perms := session.GetSitePermissions()

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

	results := &adapt.Collection{}

	// Lookup to see if this user wants to impersonate a profile.
	_, err := Load([]*adapt.LoadOp{
		{
			CollectionName: "uesio/studio.workspaceuser",
			Collection:     results,
			Query:          true,
			Fields: []adapt.LoadRequestField{
				{
					ID: "uesio/studio.profile",
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: "uesio/studio.user",
					Value: session.GetSiteUser().ID,
				},
				{
					Field: "uesio/studio.workspace",
					Value: workspace.ID,
				},
			},
		},
	}, session, nil)
	if err != nil {
		return err
	}

	workspaceSession := sess.NewWorkspaceSession(
		workspace,
		session.GetSiteUser(),
		"uesio/system.admin",
		meta.GetAdminPermissionSet(),
	)
	session.SetWorkspaceSession(workspaceSession)
	bundleDef, err := bundle.GetWorkspaceBundleDef(workspace, connection)
	if err != nil {
		return err
	}
	licenseMap, err := GetLicenses(workspace.GetAppFullName(), connection)
	if err != nil {
		return err
	}
	bundleDef.Licenses = licenseMap
	workspace.SetAppBundle(bundleDef)

	if results.Len() > 0 {
		profileKey, err := (*results)[0].GetFieldAsString("uesio/studio.profile")
		if err != nil {
			return err
		}
		if profileKey != "" {
			profile, err := LoadAndHydrateProfile(profileKey, session)
			if err != nil {
				return errors.New("Error Loading Profile: " + profileKey + " : " + err.Error())
			}

			session.SetWorkspaceSession(sess.NewWorkspaceSession(
				workspace,
				session.GetSiteUser(),
				profileKey,
				profile.FlattenPermissions(),
			))
		}

	}

	return nil

}

func AddWorkspaceContextByKey(workspaceKey string, session *sess.Session, connection adapt.Connection) (*sess.Session, error) {
	sessClone := session.RemoveWorkspaceContext()
	workspace, err := QueryWorkspaceForWrite(workspaceKey, adapt.UNIQUE_KEY_FIELD, sessClone, connection)
	if err != nil {
		return nil, fmt.Errorf("could not get workspace context: workspace %s does not exist or you don't have access to modify it.", workspaceKey)
	}
	return sessClone, addWorkspaceContext(workspace, sessClone, connection)
}

func AddWorkspaceContextByID(workspaceID string, session *sess.Session, connection adapt.Connection) (*sess.Session, error) {
	sessClone := session.RemoveWorkspaceContext()
	workspace, err := QueryWorkspaceForWrite(workspaceID, adapt.ID_FIELD, sessClone, connection)
	if err != nil {
		return nil, fmt.Errorf("could not get workspace context: workspace does not exist or you don't have access to modify it.")
	}
	return sessClone, addWorkspaceContext(workspace, sessClone, connection)
}

// QueryWorkspaceForWrite queries a workspace, with write access required
func QueryWorkspaceForWrite(value, field string, session *sess.Session, connection adapt.Connection) (*meta.Workspace, error) {
	var workspace meta.Workspace
	useSession := session
	if useSession.GetWorkspace() != nil {
		useSession = session.RemoveWorkspaceContext()
	}
	err := PlatformLoadOne(
		&workspace,
		&PlatformLoadOptions{
			Connection: connection,
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: field,
					Value: value,
				},
			},
			RequireWriteAccess: true,
		},
		useSession,
	)
	if err != nil {
		return nil, err
	}
	return &workspace, nil
}

package datasource

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/workspace"
)

type QueryWorkspaceForWriteFn func(queryValue, queryField string, session *sess.Session, connection adapt.Connection) (*meta.Workspace, error)

// this cache exists to provide quick access to essential fields about a workspace
// without having to constantly query for it
var wsKeyInfoCache cache.Cache[workspace.KeyInfo]
var queryWorkspaceForWriteFn QueryWorkspaceForWriteFn

func init() {
	wsKeyInfoCache = cache.NewMemoryCache[workspace.KeyInfo](15*time.Minute, 15*time.Minute)
	queryWorkspaceForWriteFn = QueryWorkspaceForWrite
}

func SetQueryWorkspaceForWriteFn(fn QueryWorkspaceForWriteFn) {
	queryWorkspaceForWriteFn = fn
}

func RequestWorkspaceWriteAccess(params map[string]string, connection adapt.Connection, session *sess.Session) *workspace.AccessResult {

	workspaceID := params["workspaceid"]
	workspaceName := params["workspacename"]
	appName := params["app"]
	workspaceUniqueKey := ""

	var wsKeyInfo workspace.KeyInfo

	if appName != "" && workspaceName != "" {
		workspaceUniqueKey = fmt.Sprintf("%s:%s", appName, workspaceName)
		// Try to lookup workspace key info from the key
		if result, err := wsKeyInfoCache.Get(workspaceUniqueKey); err == nil {
			wsKeyInfo = result
		}
	}
	if workspaceID != "" && wsKeyInfo.HasAnyMissingField() {
		// Try to find the workspace key info from workspace ID
		if result, err := wsKeyInfoCache.Get(workspaceID); err == nil {
			wsKeyInfo = result
		}
	}

	// First check the Studio Site Session permissions
	site := session.GetSite()
	studioPerms := session.GetSiteUser().Permissions

	var accessErr error
	// 1. Make sure we're in a site that can read/modify workspaces
	if site.GetAppFullName() != "uesio/studio" {
		accessErr = errors.New("this site does not allow working with workspaces")
	} else if !studioPerms.HasNamedPermission(constant.WorkspaceAdminPerm) {
		accessErr = errors.New("your profile does not allow you to edit workspace metadata")
	}
	if accessErr != nil {
		return workspace.NewWorkspaceAccessResult(wsKeyInfo, false, accessErr)
	}
	// 2. does the user have the workspace-specific write permission?
	haveAccess := false
	if workspaceID != "" && studioPerms.HasNamedPermission(getWorkspaceWritePermName(workspaceID)) {
		haveAccess = true
	} else if workspaceUniqueKey != "" && studioPerms.HasNamedPermission(getWorkspaceWritePermName(workspaceUniqueKey)) {
		haveAccess = true
	}
	if haveAccess {
		return workspace.NewWorkspaceAccessResult(wsKeyInfo, true, nil)
	}

	if !haveAccess {
		// Otherwise we need to query the workspace for write
		queryField := adapt.ID_FIELD
		queryValue := workspaceID
		if workspaceID == "" && workspaceUniqueKey != "" {
			queryField = adapt.UNIQUE_KEY_FIELD
			queryValue = workspaceUniqueKey
		}
		ws, err := queryWorkspaceForWriteFn(queryValue, queryField, session, connection)
		if err == nil && ws != nil {
			haveAccess = true
		} else {
			accessErr = err
		}
		// Flesh out our workspace key info cache
		if ws != nil && wsKeyInfo.HasAnyMissingField() {
			workspaceUniqueKey = fmt.Sprintf("%s:%s", appName, workspaceName)
			workspaceID = ws.ID
			wsKeyInfo = workspace.NewKeyInfo(appName, workspaceName, workspaceID)
			wsKeyInfoCache.Set(workspaceID, wsKeyInfo)
			wsKeyInfoCache.Set(workspaceUniqueKey, wsKeyInfo)
		}
	}

	return workspace.NewWorkspaceAccessResult(wsKeyInfo, haveAccess, accessErr)
}

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
	// Shortcut - if the target workspace is exactly the same as the workspace we already have,
	// just use the existing session
	if session.GetWorkspace() != nil && session.GetWorkspace().UniqueKey == workspaceKey {
		return session, nil
	}
	sessClone := session.RemoveWorkspaceContext()
	workspace, err := QueryWorkspaceForWrite(workspaceKey, adapt.UNIQUE_KEY_FIELD, sessClone, connection)
	if err != nil {
		return nil, fmt.Errorf("could not get workspace context: workspace %s does not exist or you don't have access to modify it.", workspaceKey)
	}
	return sessClone, addWorkspaceContext(workspace, sessClone, connection)
}

func AddWorkspaceContextByID(workspaceID string, session *sess.Session, connection adapt.Connection) (*sess.Session, error) {
	// Shortcut - if the target workspace is exactly the same as the workspace we already have,
	// just use the existing session
	if session.GetWorkspace() != nil && session.GetWorkspace().ID == workspaceID {
		return session, nil
	}
	sessClone := session.RemoveWorkspaceContext()
	workspace, err := QueryWorkspaceForWrite(workspaceID, adapt.ID_FIELD, sessClone, connection)
	if err != nil {
		return nil, fmt.Errorf("could not get workspace context: workspace does not exist or you don't have access to modify it.")
	}
	return sessClone, addWorkspaceContext(workspace, sessClone, connection)
}

const workspaceWritePerm = "uesio.workspacewrite.%s"

func getWorkspaceWritePermName(workspaceID string) string {
	return fmt.Sprintf(workspaceWritePerm, workspaceID)
}

func isMetadataKey(s string) bool {
	return strings.Contains(s, "/")
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
	// Shortcut to avoid having to do a join to fetch Apps every time we query workspaces
	if workspace.GetAppFullName() == "" && workspace.UniqueKey != "" {
		workspace.App.UniqueKey = strings.Split(workspace.UniqueKey, ":")[0]
	}
	// Attach the named permissions for workspace write access
	siteUserPerms := session.GetSiteUser().Permissions
	siteUserPerms.AddNamedPermission(getWorkspaceWritePermName(workspace.UniqueKey))
	siteUserPerms.AddNamedPermission(getWorkspaceWritePermName(workspace.ID))
	return &workspace, nil
}

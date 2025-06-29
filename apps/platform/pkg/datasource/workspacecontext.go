package datasource

import (
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/goutils"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
	"github.com/thecloudmasters/uesio/pkg/types/workspace"
)

type QueryWorkspaceForWriteFn func(queryValue, queryField string, session *sess.Session, connection wire.Connection) (*meta.Workspace, error)

// this cache exists to provide quick access to essential fields about a workspace
// without having to constantly query for it
var wsKeyInfoCache cache.Cache[workspace.KeyInfo]
var queryWorkspaceForWriteFn QueryWorkspaceForWriteFn

func init() {
	wsKeyInfoCache = cache.NewMemoryCache[workspace.KeyInfo](15*time.Minute, 15*time.Minute)
	queryWorkspaceForWriteFn = QueryWorkspaceForWrite
}

// setQueryWorkspaceForWriteFn this only exists for tests to be able to mock the query result
func setQueryWorkspaceForWriteFn(fn QueryWorkspaceForWriteFn) {
	queryWorkspaceForWriteFn = fn
}

func RequestWorkspaceWriteAccess(params map[string]any, connection wire.Connection, session *sess.Session) *workspace.AccessResult {

	workspaceID := goutils.StringValue(params["workspaceid"])
	workspaceName := goutils.StringValue(params["workspacename"])
	appName := goutils.StringValue(params["app"])
	workspaceUniqueKey := ""

	wsKeyInfo := workspace.NewKeyInfo(appName, workspaceName, workspaceID)

	if siteAdminSession := session.GetSiteAdminSession(); siteAdminSession != nil {
		site := siteAdminSession.GetSite()
		if site.GetAppFullName() != "uesio/studio" || site.Name != "prod" {
			return workspace.NewWorkspaceAccessResult(wsKeyInfo, false, false, exceptions.NewForbiddenException(
				"you do not have permission to perform the requested operation"))
		}
		return workspace.NewWorkspaceAccessResult(wsKeyInfo, true, true, nil)
	}

	if appName != "" && workspaceName != "" {
		workspaceUniqueKey = fmt.Sprintf("%s:%s", appName, workspaceName)
	}
	if workspaceID != "" && wsKeyInfo.HasAnyMissingField() {
		// Try to find the workspace key info from workspace ID
		if result, err := wsKeyInfoCache.Get(workspaceID); err == nil {
			wsKeyInfo = result
		} else if !errors.Is(err, cache.ErrKeyNotFound) {
			slog.ErrorContext(session.Context(), fmt.Sprintf("error getting key info for workspace id [%s] from cache: %v", workspaceID, err))
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
		return workspace.NewWorkspaceAccessResult(wsKeyInfo, false, false, accessErr)
	}
	// 2. does the user have the workspace-specific write permission,
	// or is this a Studio Super-User (such as the  Anonymous Admin Session which we use for Workspace Bundle Store?)
	haveAccess := studioPerms.HasNamedPermission(getWorkspaceWritePermName(workspaceID)) || studioPerms.ModifyAllRecords

	if !haveAccess {
		// Otherwise we need to query the workspace for write
		queryField := commonfields.Id
		queryValue := workspaceID
		if workspaceID == "" && workspaceUniqueKey != "" {
			queryField = commonfields.UniqueKey
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
			workspaceID = ws.ID
			wsKeyInfo = workspace.NewKeyInfo(appName, workspaceName, workspaceID)
			wsKeyInfoCache.Set(workspaceID, wsKeyInfo)
		}
	}
	// Ensure our params are hydrated before returning with the full results of our checks
	params["workspaceid"] = wsKeyInfo.GetWorkspaceID()
	params["workspacename"] = wsKeyInfo.GetWorkspaceName()
	params["app"] = wsKeyInfo.GetAppName()
	return workspace.NewWorkspaceAccessResult(wsKeyInfo, haveAccess, false, accessErr)
}

func addWorkspaceImpersonationContext(workspace *meta.Workspace, session *sess.Session, connection wire.Connection) error {

	if session.GetWorkspace() == nil {
		return errors.New("must already have a workspace context to add impersonation")
	}

	results := &wire.Collection{}

	// Lookup to see if this user wants to impersonate a profile.
	err := LoadWithError(&wire.LoadOp{
		WireName:       "CheckImpersonationWorkspaceContext",
		CollectionName: "uesio/studio.workspaceuser",
		Collection:     results,
		Query:          true,
		Fields: []wire.LoadRequestField{
			{
				ID: "uesio/studio.profile",
			},
		},
		Conditions: []wire.LoadRequestCondition{
			{
				Field: "uesio/studio.user",
				Value: session.GetSiteUser().ID,
			},
			{
				Field: "uesio/studio.workspace",
				Value: workspace.ID,
			},
		},
	}, session.RemoveWorkspaceContext(), &LoadOptions{
		Connection: connection,
	})
	if err != nil {
		return err
	}

	if results.Len() > 0 {
		profileKey, err := (*results)[0].GetFieldAsString("uesio/studio.profile")
		if err != nil {
			return err
		}
		if profileKey != "" {
			profile, err := LoadAndHydrateProfile(profileKey, session)
			if err != nil {
				return fmt.Errorf("error loading profile: %s : %w", profileKey, err)
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

func addWorkspaceContext(workspace *meta.Workspace, session *sess.Session, connection wire.Connection) error {
	site := session.GetSite()
	perms := session.GetSitePermissions()

	// 1. Make sure we're in a site that can read/modify workspaces
	if site.GetAppFullName() != "uesio/studio" {
		return errors.New("this site does not allow working with workspaces")
	}
	// 2. we should have a profile that allows modifying workspaces
	if !perms.HasNamedPermission(constant.WorkspaceAdminPerm) {
		return errors.New("your profile does not allow you to work with workspaces")
	}

	workspaceSession := sess.NewWorkspaceSession(
		workspace,
		session.GetSiteUser(),
		"uesio/system.admin",
		meta.GetAdminPermissionSet(),
	)
	session.SetWorkspaceSession(workspaceSession)
	bundleDef, err := bundle.GetWorkspaceBundleDef(session.Context(), workspace, connection)
	if err != nil {
		return err
	}
	licenseMap, err := GetLicenses(workspace.GetAppFullName(), connection)
	if err != nil {
		return err
	}
	bundleDef.Licenses = licenseMap
	workspace.SetAppBundle(bundleDef)

	return nil

}

func AddWorkspaceImpersonationContext(workspaceKey string, session *sess.Session, connection wire.Connection) (*sess.Session, error) {
	// Shortcut - if the target workspace is exactly the same as the workspace we already have,
	// just use the existing session
	if session.GetWorkspace() != nil && session.GetWorkspace().UniqueKey == workspaceKey {
		return session, nil
	}
	sessClone := session.RemoveWorkspaceContext()
	workspace, err := QueryWorkspaceForWrite(workspaceKey, commonfields.UniqueKey, sessClone, connection)
	if err != nil {
		return nil, fmt.Errorf("could not get workspace context: workspace %s does not exist or you don't have access to modify it", workspaceKey)
	}
	err = addWorkspaceContext(workspace, sessClone, connection)
	if err != nil {
		return nil, err
	}
	err = addWorkspaceImpersonationContext(workspace, sessClone, connection)
	if err != nil {
		return nil, err
	}
	return sessClone, nil
}

func AddWorkspaceContextByKey(workspaceKey string, session *sess.Session, connection wire.Connection) (*sess.Session, error) {
	// Shortcut - if the target workspace is exactly the same as the workspace we already have,
	// just use the existing session
	if session.GetWorkspace() != nil && session.GetWorkspace().UniqueKey == workspaceKey {
		return session, nil
	}
	sessClone := session.RemoveWorkspaceContext()
	workspace, err := QueryWorkspaceForWrite(workspaceKey, commonfields.UniqueKey, sessClone, connection)
	if err != nil {
		return nil, fmt.Errorf("could not get workspace context: workspace %s does not exist or you don't have access to modify it", workspaceKey)
	}
	return sessClone, addWorkspaceContext(workspace, sessClone, connection)
}

func AddWorkspaceContextByID(workspaceID string, session *sess.Session, connection wire.Connection) (*sess.Session, error) {
	// Shortcut - if the target workspace is exactly the same as the workspace we already have,
	// just use the existing session
	if session.GetWorkspace() != nil && session.GetWorkspace().ID == workspaceID {
		return session, nil
	}
	sessClone := session.RemoveWorkspaceContext()
	workspace, err := QueryWorkspaceForWrite(workspaceID, commonfields.Id, sessClone, connection)
	if err != nil {
		return nil, errors.New("could not get workspace context: workspace does not exist or you don't have access to modify it")
	}
	return sessClone, addWorkspaceContext(workspace, sessClone, connection)
}

const workspaceWritePerm = "uesio.workspacewrite.%s"

func getWorkspaceWritePermName(workspaceID string) string {
	return fmt.Sprintf(workspaceWritePerm, workspaceID)
}

// QueryWorkspaceForWrite queries a workspace, with write access required
func QueryWorkspaceForWrite(value, field string, session *sess.Session, connection wire.Connection) (*meta.Workspace, error) {
	var workspace meta.Workspace
	useSession := session
	if useSession.GetWorkspace() != nil {
		useSession = session.RemoveWorkspaceContext()
	}
	err := PlatformLoadOne(
		&workspace,
		&PlatformLoadOptions{
			WireName:   "QueryWorkspaceForWrite",
			Connection: connection,
			Fields: []wire.LoadRequestField{
				{
					ID: "uesio/studio.name",
				},
				{
					ID: "uesio/studio.loginroute",
				},
				{
					ID: "uesio/studio.signuproute",
				},
				{
					ID: "uesio/studio.homeroute",
				},
				{
					ID: "uesio/studio.defaulttheme",
				},
				{
					ID: "uesio/studio.publicprofile",
				},
				{
					ID: "uesio/studio.favicon",
				},
			},
			Conditions: []wire.LoadRequestCondition{
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
		return nil, errors.New("you do not have write access to this workspace")
	}

	// Shortcut to avoid having to do a join to fetch Apps every time we query workspaces
	appKey, _, _ := strings.Cut(workspace.UniqueKey, ":")
	workspace.App = &meta.App{
		BuiltIn: meta.BuiltIn{
			UniqueKey: appKey,
		},
		FullName: appKey,
	}
	// Attach the named permissions for workspace write access
	siteUserPerms := session.GetSiteUser().Permissions
	siteUserPerms.AddNamedPermission(getWorkspaceWritePermName(workspace.ID))
	return &workspace, nil
}

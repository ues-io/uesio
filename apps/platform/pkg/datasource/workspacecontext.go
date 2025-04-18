package datasource

import (
	"errors"
	"fmt"
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
var wsKeyInfoIdCache cache.Cache[workspace.KeyInfo]
var queryWorkspaceForWriteFn QueryWorkspaceForWriteFn

func init() {
	wsKeyInfoIdCache = cache.NewMemoryCache[workspace.KeyInfo](15*time.Minute, 15*time.Minute)
	queryWorkspaceForWriteFn = QueryWorkspaceForWrite
}

// setQueryWorkspaceForWriteFn this only exists for tests to be able to mock the query result
func setQueryWorkspaceForWriteFn(fn QueryWorkspaceForWriteFn) {
	queryWorkspaceForWriteFn = fn
}

// TODO: Re-evaluate the approach of why we do this and if still needed, how we do this. The entire approach to this can likely be simplified
// to always ensure we have a full wsKeyInfo (all fields and in all situations) and minimize database hits by possibly caching the uniquekey
// as well as the id. If the uniquekey is cached, it needs to be invalidated when the workspace gets deleted because the uniquekey to id map
// is mutable - for example, you could create a workspace, delete it and create it with the same name. When invalidating the cache, need
// to be careful of "reads" to the cache while the new value is being written and also if the "save/after bot" that would do a notify fails to
// actually complete. Likely best in this case to just clear the uniquekey field and not set it again in the invalidate and just let the
// next call to this method find the current id for that uniquekey. In short, the general approach should likely be:
//  1. Get frmo cache
//  2. If nothing in cache, lookup based on either id (to get the unique key) or uniquekey (to get the id) using an elevated context to just retrieve the 3 fields needed
//  3. if no match, return error
//  4. if match, store in cache
//  5. continue processing with the various scenarios (e.g., Site Admin, non-site general perm checks, non-site admin workspace
//     perm checks)
func RequestWorkspaceWriteAccess(params map[string]interface{}, connection wire.Connection, session *sess.Session) *workspace.AccessResult {

	wsKeyInfo := workspace.NewKeyInfo(goutils.StringValue(params["app"]), goutils.StringValue(params["workspacename"]), goutils.StringValue(params["workspaceid"]))

	// TODO: This could return an AccessResult that contains a wsKeyInfo with empty
	// fields in any or all of the properties workspaceId, appName, workspaceName. For
	// backwards compat, leaving as-is for now since we're a SiteAdmin anyway but this
	// should likely be revisited and evaluated as it could have unexpected behavior
	// downstream. In most cases, when SiteAdminSession, the params aren't used however
	// since SiteAdminSession has system wide access.
	if siteAdminSession := session.GetSiteAdminSession(); siteAdminSession != nil {
		site := siteAdminSession.GetSite()
		if site.GetAppFullName() != "uesio/studio" || site.Name != "prod" {
			return workspace.NewWorkspaceAccessResult(wsKeyInfo, false, false, exceptions.NewForbiddenException(
				"you do not have permission to perform the requested operation"))
		}
		return workspace.NewWorkspaceAccessResult(wsKeyInfo, true, true, nil)
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
	} else if wsKeyInfo.GetWorkspaceID() == "" && wsKeyInfo.GetUniqueKey() == "" {
		// if we do not have either of these, there is nothing we can go "look up"
		accessErr = errors.New("workspaceid or both app and workspacename must be provided")
	}
	if accessErr != nil {
		return workspace.NewWorkspaceAccessResult(wsKeyInfo, false, false, accessErr)
	}

	if wsKeyInfo.GetWorkspaceID() != "" && wsKeyInfo.HasAnyMissingField() {
		if result, err := wsKeyInfoIdCache.Get(wsKeyInfo.GetWorkspaceID()); err == nil {
			wsKeyInfo = result
		}
	}

	// 2. does the user have the workspace-specific write permission,
	// or is this a Studio Super-User (such as the  Anonymous Admin Session which we use for Workspace Bundle Store?)
	haveAccess := (wsKeyInfo.GetWorkspaceID() != "" && studioPerms.HasNamedPermission(getWorkspaceWritePermName(wsKeyInfo.GetWorkspaceID()))) || studioPerms.ModifyAllRecords

	// we do not cache access itself so we will query every time to check for access which is needed in case our access changes in
	// real-time. Note that we'll only find permissions in studioPermissions if we have a wsKeyInfo.GetWorkspaceID() so if we only have
	// uniquekey, we'll never have access unless we have studioPerms.ModifyAllRecords. If we do have studioPerms.ModifyAllRecords we
	// will never go to the database so even if we were caching uniquekey, it wouldn't be in the cache with the workspaceid that is needed
	// for HasNamedPermission lookup. We do not go to the database below when we don't have access or when wsKeyInfo.HasMissingField() because
	// this would result in us going to the database every time we only have a uniquekey since we don't cache it.
	// TODO: See potential improvements mentioned in comment above function signature.
	if !haveAccess {
		// Otherwise we need to query the workspace for write
		queryField := commonfields.Id
		queryValue := wsKeyInfo.GetWorkspaceID()
		if queryValue == "" && wsKeyInfo.GetUniqueKey() != "" {
			queryField = commonfields.UniqueKey
			queryValue = wsKeyInfo.GetUniqueKey()
		}
		ws, err := queryWorkspaceForWriteFn(queryValue, queryField, session, connection)
		if err == nil && ws != nil {
			haveAccess = true
		} else {
			accessErr = err
		}
		// Flesh out our workspace key info cache
		if ws != nil && wsKeyInfo.HasAnyMissingField() {
			wsKeyInfo = workspace.NewKeyInfo(ws.App.FullName, ws.Name, ws.ID)
			// NOTE - We only cache by id since the uniquekey->id mapping is mutable (e.g., create workspace, delete it, create w/ same name). We could cache by uniquekey
			// if we clear the cache if/when a workspace gets deleted
			// TODO: Is there a way to get notified so we can avoid the lookup below every time we only have a uniquekey?
			wsKeyInfoIdCache.Set(ws.ID, wsKeyInfo)
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
		return errors.New("Must already have a workspace context to add impersonation.")
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
		return nil, fmt.Errorf("could not get workspace context: workspace %s does not exist or you don't have access to modify it.", workspaceKey)
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
		return nil, fmt.Errorf("could not get workspace context: workspace %s does not exist or you don't have access to modify it.", workspaceKey)
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
		return nil, fmt.Errorf("could not get workspace context: workspace does not exist or you don't have access to modify it.")
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

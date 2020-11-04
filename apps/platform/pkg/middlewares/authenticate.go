package middlewares

import (
	"context"
	"errors"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func init() {
	session.Global.Close()
	allowInsecureCookies := os.Getenv("UESIO_ALLOW_INSECURE_COOKIES")
	storageType := os.Getenv("UESIO_SESSION_STORE")

	var store session.Store
	if storageType == "filesystem" {
		store = auth.NewFSSessionStore()
	} else if storageType == "" {
		store = session.NewInMemStore()
	} else {
		panic("UESIO_SESSION_STORE is an unrecognized value: " + storageType)
	}

	options := &session.CookieMngrOptions{
		AllowHTTP: allowInsecureCookies == "true",
	}

	session.Global = session.NewCookieManagerOptions(store, options)
}

// Authenticate checks to see if the current user is logged in
func Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		// Get the site we're currently using from our host
		// TODO: for better performance, we could think about
		// Getting the site from the session if it exists.
		// That way we wouldn't have to look up the site from the
		// host every time we authenticate.
		site, err := auth.GetSiteFromHost(r.Host)
		if err != nil {
			http.Error(w, "Failed to get site from domain:"+err.Error(), http.StatusInternalServerError)
			return
		}

		s, err := sess.GetSessionFromRequest(w, r, site)
		if err != nil {
			http.Error(w, "Failed to create session", http.StatusInternalServerError)
			return
		}

		permSet, err := bundles.GetProfilePermSet(s)
		if err != nil {
			http.Error(w, "Failed to load permissions", http.StatusInternalServerError)
			return
		}

		s.SetPermissions(permSet)

		// We have a session, use it
		ctx := context.WithValue(r.Context(), sessionKey, s)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// AuthenticateWorkspace checks to see if the current user is logged in
func AuthenticateWorkspace(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		appName := vars["app"]
		workspaceName := vars["workspace"]

		session := GetSession(r)
		site := session.GetSite()
		perms := session.GetPermissions()

		// 1. Make sure we're in a site that can read/modify workspaces
		if site.Name != "studio" {
			err := errors.New("this site does not allow working with workspaces")
			logger.LogError(err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		// 2. we should have a profile that allows modifying workspaces
		if !perms.HasPermission(&metadata.PermissionSet{
			NamedRefs: map[string]bool{
				"workspace_admin": true,
			},
		}) {
			err := errors.New("your profile does not allow you to work with workspaces")
			logger.LogError(err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Get the Workspace from the DB
		var workspaces metadata.WorkspaceCollection
		err := datasource.PlatformLoad(
			[]metadata.CollectionableGroup{
				&workspaces,
			},
			workspaces.ByNameRequest(appName, workspaceName),
			session,
		)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Failed querying workspace: "+err.Error(), http.StatusInternalServerError)
			return
		}

		if len(workspaces) != 1 {
			http.Error(w, "Too many or too few workspaces", http.StatusInternalServerError)
			return
		}

		workspace := &workspaces[0]

		// Get the workspace permissions and set them on the session
		// For now give workspace users access to everything.
		adminPerms := &metadata.PermissionSet{
			AllowAllViews:  true,
			AllowAllRoutes: true,
			AllowAllFiles:  true,
		}

		workspace.Permissions = adminPerms

		session.SetWorkspace(workspace)
		next.ServeHTTP(w, r)
	})
}

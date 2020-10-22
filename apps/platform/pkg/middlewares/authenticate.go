package middlewares

import (
	"context"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
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

		ctx := context.WithValue(r.Context(), SiteKey, site)

		sess := session.Get(r)
		if sess == nil {
			newSession, err := auth.CreatePublicSession(site)
			if err != nil {
				http.Error(w, "Failed to create session", http.StatusInternalServerError)
				return
			}
			sess = *newSession
			// Don't add the session cookie for the login route
			if r.URL.Path != "/site/auth/login" {
				session.Add(sess, w)
			}
		}

		// TODO: Possibly verify that the siteName on the session
		// matches the siteName we got from our host

		// We have a session, use it
		ctx = context.WithValue(ctx, SessionKey, &sess)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// AuthenticateWorkspace checks to see if the current user is logged in
func AuthenticateWorkspace(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		appName := vars["app"]
		workspaceName := vars["workspace"]

		site := r.Context().Value(SiteKey).(*metadata.Site)
		sess := r.Context().Value(SessionKey).(*session.Session)

		// Get the Workspace from the DB
		var apps metadata.AppCollection
		var workspaces metadata.WorkspaceCollection
		err := datasource.PlatformLoad(
			[]metadata.CollectionableGroup{
				&apps,
				&workspaces,
			},
			workspaces.ByNameRequest(appName, workspaceName),
			site,
			sess,
		)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Failed querying workspace", http.StatusInternalServerError)
			return
		}

		if len(workspaces) != 1 {
			http.Error(w, "Too many or too few workspaces", http.StatusInternalServerError)
			return
		}

		workspace := &workspaces[0]
		app := &apps[0]

		workspace.AppRef = app.Name

		site.Workspace = workspace
		next.ServeHTTP(w, r)
	})
}

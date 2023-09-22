package middleware

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/sess"

	"github.com/gorilla/mux"
	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
)

// Checks if the session returned with the user's original HTML route load
// is different from the session being sent in the current request,
// by comparing the Uesio session id hash in the original HTML request
// to the hash of the session id sent in an XHR request.
func userSessionHasChangedSinceOriginalRouteLoad(r *http.Request, s *sess.Session) bool {
	originalSessionHash := r.Header.Get("x-uesio-osh")
	currentSessionHash := s.GetSessionIdHash()
	// If the original session hash is different from the current hash,
	// then the user's session cookie has changed since the page was originally loaded
	return originalSessionHash != "" && currentSessionHash != "" && originalSessionHash != currentSessionHash
}

// If the current session is a "guest" user session,
// and if the user's session has changed since the original HTML route load,
// then we assume that the user was logged out, so we need to redirect them to the login page
func userHasBeenLoggedOut(r *http.Request, s *sess.Session) bool {
	if !s.IsPublicProfile() {
		return false
	}
	return userSessionHasChangedSinceOriginalRouteLoad(r, s)
}

// Authenticate checks to see if the current user is logged in
func Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		// Get the site we're currently using from our host
		site, err := auth.GetSiteFromHost(r.Host)
		if err != nil {
			http.Error(w, "Failed to get site from domain:"+err.Error(), http.StatusInternalServerError)
			return
		}

		// Do we have a session id?
		browserSession := session.Get(r)

		user, err := auth.GetUserFromBrowserSession(browserSession, site)
		if err != nil {
			http.Error(w, "Failed to get user from site:"+err.Error(), http.StatusInternalServerError)
			return
		}

		if browserSession == nil {
			browserSession = sess.CreateBrowserSession(w, user, site)
		}

		s, err := auth.GetSessionFromUser(browserSession.ID(), user, site)
		if err != nil {
			http.Error(w, "Failed to create session: "+err.Error(), http.StatusInternalServerError)
			return
		}
		// If the session is expired, and it's not for a public user
		if s != nil && sess.IsExpired(browserSession) && !s.IsPublicProfile() {
			session.Remove(browserSession, w)
			auth.RedirectToLoginRoute(w, r.WithContext(SetSession(r, s)), s, auth.Expired)
			return
		}
		if userHasBeenLoggedOut(r, s) && auth.RedirectToLoginRoute(w, r, s, auth.LoggedOut) {
			return
		}

		next.ServeHTTP(w, r.WithContext(SetSession(r, s)))
	})
}

func AuthenticateSiteAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		appName := vars["app"]
		siteName := vars["site"]
		s := GetSession(r)
		siteAdminSession, err := datasource.AddSiteAdminContextByKey(appName+":"+siteName, s, nil)
		if err != nil {
			auth.RedirectToLoginRoute(w, r.WithContext(SetSession(r, s)), s, auth.Expired)
			return
		}

		next.ServeHTTP(w, r.WithContext(SetSession(r, siteAdminSession)))
	})
}

func AuthenticateWorkspace(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		appName := vars["app"]
		workspaceName := vars["workspace"]
		s := GetSession(r)
		workspaceSession, err := datasource.AddWorkspaceContextByKey(appName+":"+workspaceName, s, nil)
		if err != nil {
			auth.RedirectToLoginRoute(w, r.WithContext(SetSession(r, s)), s, auth.Expired)
			return
		}
		next.ServeHTTP(w, r.WithContext(SetSession(r, workspaceSession)))
	})
}

func AuthenticateVersion(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		version := vars["version"]
		app := vars["app"]
		versionSession, err := datasource.AddVersionContext(app, version, GetSession(r), nil)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Failed querying version: "+err.Error(), http.StatusInternalServerError)
			return
		}
		next.ServeHTTP(w, r.WithContext(SetSession(r, versionSession)))
	})
}

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

		s, err := auth.GetSessionFromRequest(browserSession, site)
		if err != nil {
			http.Error(w, "Failed to create session: "+err.Error(), http.StatusInternalServerError)
			return
		}
		// If the session is expired, and it's not for a public user
		if s != nil && s.IsExpired() && !s.IsPublicProfile() {
			removeSessionAndRedirectToLoginRoute(w, r, s, auth.Expired)
			return
		}
		// If we didn't have a session from the browser, add it now.
		if browserSession == nil {
			session.Add(*s.GetBrowserSession(), w)
		} else if browserSession != nil && browserSession != *s.GetBrowserSession() {
			// If we got a different session than the one we started with, logout the old one
			session.Remove(browserSession, w)
		} else if userHasBeenLoggedOut(r, s) && auth.RedirectToLoginRoute(w, r, s, auth.LoggedOut) {
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
		err := datasource.AddSiteAdminContextByKey(appName+":"+siteName, s, nil)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "failed getting siteadmin context: "+err.Error(), http.StatusInternalServerError)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func AuthenticateWorkspace(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		appName := vars["app"]
		workspaceName := vars["workspace"]
		s := GetSession(r)
		err := datasource.AddWorkspaceContextByKey(appName+":"+workspaceName, s, nil)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "failed getting workspace context: "+err.Error(), http.StatusInternalServerError)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func removeSessionAndRedirectToLoginRoute(w http.ResponseWriter, r *http.Request, s *sess.Session, reason auth.RedirectReason) {
	// Remove the session and redirect to login page
	session.Remove(*s.GetBrowserSession(), w)
	auth.RedirectToLoginRoute(w, r.WithContext(SetSession(r, s)), s, reason)
	return
}

func AuthenticateVersion(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		namespace := vars["namespace"]
		version := vars["version"]
		app := vars["app"]
		err := auth.AddVersionContext(app, namespace, version, GetSession(r))
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Failed querying version: "+err.Error(), http.StatusInternalServerError)
			return
		}
		next.ServeHTTP(w, r)
	})
}

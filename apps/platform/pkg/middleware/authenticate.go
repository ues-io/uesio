package middleware

import (
	"log/slog"
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/sess"

	"github.com/gorilla/mux"
	"github.com/icza/session"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
)

// Authenticate checks to see if the current user is logged in
func Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		// Get the site we're currently using from our host
		site, err := auth.GetSiteFromHost(r.Host)
		if err != nil {
			http.Error(w, "Failed to get site from domain: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Does the request have an authorization header?
		fullToken := r.Header.Get("Authorization")
		if fullToken != "" {
			splitToken := strings.Split(fullToken, "Bearer ")
			if len(splitToken) != 2 {
				http.Error(w, "Invalid bearer token format", http.StatusUnauthorized)
				return
			}
			authToken := splitToken[1]

			user, err := auth.GetUserFromAuthToken(authToken, site)
			if err != nil {
				http.Error(w, "Invalid bearer token", http.StatusUnauthorized)
				return
			}

			s, err := auth.GetSessionFromUser("", user, site)
			if err != nil {
				http.Error(w, "Failed to create session: "+err.Error(), http.StatusInternalServerError)
				return
			}
			next.ServeHTTP(w, r.WithContext(SetSession(r, s)))
			return
		}

		// Do we have a session id?
		browserSession := session.Get(r)

		user, err := auth.GetUserFromBrowserSession(browserSession, site)
		if err != nil {
			if browserSession != nil {
				session.Remove(browserSession, w)
			}
			publicSession, err := auth.GetPublicSession(site, nil)
			if err != nil {
				http.Error(w, "Failed to create public session: "+err.Error(), http.StatusInternalServerError)
				return
			}

			auth.RedirectToLoginRoute(w, r, publicSession, auth.NotFound)
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
		workspaceSession, err := datasource.AddWorkspaceImpersonationContext(appName+":"+workspaceName, s, nil)
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
			slog.Error(err.Error())
			http.Error(w, "Failed querying version: "+err.Error(), http.StatusInternalServerError)
			return
		}
		next.ServeHTTP(w, r.WithContext(SetSession(r, versionSession)))
	})
}

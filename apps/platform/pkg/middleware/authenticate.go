package middleware

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
)

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

		// If we didn't have a session from the browser, add it now.
		if browserSession == nil {
			session.Add(*s.GetBrowserSession(), w)
		} else if browserSession != nil && browserSession != *s.GetBrowserSession() {
			// If we got a different session than the one we started with,
			// logout the old one
			session.Remove(browserSession, w)
		}

		next.ServeHTTP(w, r.WithContext(SetSession(r, s)))
	})
}

func AuthenticateSiteAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		appName := vars["app"]
		siteName := vars["site"]
		err := auth.AddSiteAdminContext(appName, siteName, GetSession(r))
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Failed querying site admin: "+err.Error(), http.StatusInternalServerError)
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
		err := datasource.AddWorkspaceContextByKey(appName+":"+workspaceName, GetSession(r), nil)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Failed querying workspace: "+err.Error(), http.StatusInternalServerError)
			return
		}
		next.ServeHTTP(w, r)
	})
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

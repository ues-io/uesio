package middleware

import (
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

	"github.com/gorilla/mux"
	"github.com/icza/session"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
)

// Authenticate checks to see if the current user is logged in
func Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		// Get the site we're currently using from our host
		site, err := auth.GetSiteFromHost(r.Host)
		if err != nil {
			HandleError(ctx, w, fmt.Errorf("failed to get site from domain: %w", err))
			return
		}

		// Does the request have an authorization header?
		fullToken := r.Header.Get("Authorization")
		if fullToken != "" {
			splitToken := strings.Split(fullToken, "Bearer ")
			if len(splitToken) != 2 {
				// current HandleError will send error message to client to log reason
				// separately to avoid leaking details to client
				slog.ErrorContext(ctx, "invalid bearer token format")
				HandleError(ctx, w, exceptions.NewUnauthorizedException("not authorized"))
				return
			}
			authToken := splitToken[1]

			user, err := auth.GetUserFromAuthToken(authToken, site)
			if err != nil {
				// current HandleError will send error message to client to log reason
				// separately to avoid leaking details to client
				slog.ErrorContext(ctx, "unable to get user from bearer token: "+err.Error())
				HandleError(ctx, w, exceptions.NewUnauthorizedException("not authorized"))
				return
			}

			s, err := auth.GetSessionFromUser("", user, site)
			if err != nil {
				HandleError(ctx, w, fmt.Errorf("failed to create session: %w", err))
				return
			}
			setSession(ctx, s)
			next.ServeHTTP(w, r.WithContext(ctx))
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
				HandleError(ctx, w, fmt.Errorf("failed to create public session: %w", err))
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
			HandleError(ctx, w, fmt.Errorf("failed to create session: %w", err))
			return
		}
		// If the session is expired, and it's not for a public user
		if s != nil && sess.IsExpired(browserSession) && !s.IsPublicProfile() {
			session.Remove(browserSession, w)
			setSession(ctx, s)
			auth.RedirectToLoginRoute(w, r.WithContext(ctx), s, auth.Expired)
			return
		}

		setSession(ctx, s)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func AuthenticateSiteAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		vars := mux.Vars(r)
		appName := vars["app"]
		siteName := vars["site"]
		s := GetSession(r)
		siteAdminSession, err := datasource.AddSiteAdminContextByKey(appName+":"+siteName, s, nil)
		if err != nil {
			setSession(ctx, s)
			auth.RedirectToLoginRoute(w, r.WithContext(ctx), s, auth.Expired)
			return
		}

		setSession(ctx, siteAdminSession)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func AuthenticateWorkspace(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		vars := mux.Vars(r)
		appName := vars["app"]
		workspaceName := vars["workspace"]
		s := GetSession(r)
		workspaceSession, err := datasource.AddWorkspaceImpersonationContext(appName+":"+workspaceName, s, nil)
		if err != nil {
			setSession(ctx, s)
			auth.RedirectToLoginRoute(w, r.WithContext(ctx), s, auth.Expired)
			return
		}
		setSession(ctx, workspaceSession)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func AuthenticateVersion(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		vars := mux.Vars(r)
		version := vars["version"]
		app := vars["app"]
		versionSession, err := datasource.AddVersionContext(app, version, GetSession(r), nil)
		if err != nil {
			HandleError(ctx, w, fmt.Errorf("failed querying version: %w", err))
			return
		}
		setSession(ctx, versionSession)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

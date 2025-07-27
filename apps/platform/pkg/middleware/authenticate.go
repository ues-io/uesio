package middleware

import (
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
)

func BrowserSessionHandler() func(next http.Handler) http.Handler {
	return auth.BrowserSessionManager.LoadAndSave
}

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

			s, err := auth.GetSessionFromUser(user, site, "")
			if err != nil {
				HandleError(ctx, w, fmt.Errorf("failed to create session: %w", err))
				return
			}
			setSession(ctx, s)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		s, err := createSessionFromBrowserSession(r, site)
		if err != nil {
			HandleError(ctx, w, err)
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
		siteAdminSession, err := datasource.AddSiteAdminContextByKey(appName+":"+siteName, GetSession(r), nil)
		if err != nil {
			HandleContextSwitchAuthError(w, r.WithContext(ctx), err)
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
		workspaceSession, err := datasource.AddWorkspaceImpersonationContextByKey(appName+":"+workspaceName, GetSession(r), nil)
		if err != nil {
			HandleContextSwitchAuthError(w, r.WithContext(ctx), err)
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
			HandleContextSwitchAuthError(w, r.WithContext(ctx), err)
			return
		}
		setSession(ctx, versionSession)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func HandleContextSwitchAuthError(w http.ResponseWriter, r *http.Request, err error) {
	ctx := r.Context()
	s := GetSession(r)

	// TODO: This is not ideal but given the way the underlying code works currently, we special case these exception types
	// for a user that is not currently logged in. THe approach to authentication and authorization detection and the underlying
	// error types themselves need to be revisted and a consistent and reliabble approach implemented to avoid having to "guess"
	// at higher levels.
	if s.IsPublicUser() && (exceptions.IsType[*exceptions.UnauthorizedException](err) || exceptions.IsType[*exceptions.NotFoundException](err) || exceptions.IsType[*exceptions.ForbiddenException](err)) {
		// TODO: Should we using auth.LoggedOut here but RedirectToLoginRoute only applies 200 with Location header when auth.Expired
		// is specified so maintaining that for backwards compat for now. This should be revisited and appropriate reasons specified.
		auth.RedirectToLoginRoute(w, r.WithContext(ctx), s, auth.Expired)
		return
	}

	// TODO: There is something to be said to special case Unauthorized & Forbidden to NotFound here to be more obsurce but for now, since
	// we know the user is logged in, we return actual error
	HandleError(ctx, w, err)
}

// Creates a uesio session from the request context based on the following:
//
//  1. If there is an existing browser session in the cache based on the sessid in the request, a uesio session will be built from it
//  2. If there is no sessid in the request, a public user browser session will be created and a uesio session built from it
//  3. If there is a sessid in the request but we do not have data in the cache (e.g., expired session, invalid sessid, etc.) a public
//     user browser session will be created and a uesio session built from it
//  4. If an error is encountered while performing the above process, the error will be returned
//
// NOTE: Public user browser sessions are not stored in the session cache unless additional data (e.g., preferences) is added to them
// which, as of this writing, we currently do not do. This is done for several reasons: 1) Performance - there is no need to store
// SiteID/UserID for public user since it's easily derived via GetPublicUser and avoids cache lookups on every request; 2) It helps
// mitigate risks of race conditions with browser requests while processing a login when the sessid is changing but browsers have
// simultaneous inbound requests that are are processed server side after the login request has been processed which caused the
// public session to be removed from the cache. By avoiding writing public browser sessions to cache, we mitigate these race
// condition risks. See git history of this function for more details in its function comment and code on how this was worked around
// prior to https://github.com/ues-io/uesio/pull/5076 being implemented which eliminated writing public browser sessions to cache.
func createSessionFromBrowserSession(r *http.Request, site *meta.Site) (*sess.Session, error) {
	ctx := r.Context()
	browserSiteID := auth.BrowserSessionManager.GetString(ctx, auth.SiteIDKey)
	browserUserID := auth.BrowserSessionManager.GetString(ctx, auth.UserIDKey)

	if browserSiteID == "" && browserUserID == "" {
		return auth.CreateSessionForPublicUser(site)
	}

	if browserSiteID != site.ID {
		// TODO: Should we just clear and recover to a public session here? Technically we received
		// a request that is invalid so I think we should just reject the entire request since we
		// cannot trust it
		auth.BrowserSessionManager.Destroy(ctx)
		return nil, exceptions.NewUnauthorizedException("invalid_browser_session: site_mismatch")
	}

	user, err := auth.GetCachedUserByID(browserUserID, site)
	if err == nil {
		return auth.GetSessionFromUser(user, site, auth.BrowserSessionManager.Token(ctx))
	}

	if exceptions.IsType[*exceptions.NotFoundException](err) {
		return auth.HandlePriviledgeChange(ctx, nil, site)
	} else {
		return nil, err
	}
}

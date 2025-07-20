package middleware

import (
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
)

func BrowserSession() func(next http.Handler) http.Handler {
	return auth.BrowserSession()
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

			s, err := auth.CreateSessionFromUser(user, site)
			if err != nil {
				HandleError(ctx, w, fmt.Errorf("failed to create session: %w", err))
				return
			}
			setSession(ctx, s)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		s, err := auth.CreateSessionFromBrowserSession(ctx, site)
		if err != nil {
			HandleError(ctx, w, fmt.Errorf("failed to create session: %w", err))
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

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
			// TODO: We failed to get the user but this could be for any number of reasons, for example
			// a database or redis issue.  Should we permanently remove the session here? If we don't
			// we could run in to infite loop so we must do something but.....possibly keep track of
			// attempts?  We could use Attrs on the session but we haven't implemented it 100% correctly
			// so changes to Attrs don't write back to the backing store currently.
			// NOTE: There are several reasons we could fail to GetUserFromBrowserSession, some are due to invalid
			// cookies which we can't recover from and some infra/system related (e.g., db failure) that we could
			// recover from. The approach below mirrors the previous approach where we treat any error as unrecoverable,
			// remove the session we had and create a new public one.  The only difference from prior approach is that
			// we no longer redirect to login and instead pass through middleware as a public session. We can't redirect
			// in middleware for a number of reasons (e.g., we don't know if the route is public/priviate, we don't know
			// if there's even a login route, etc.).
			// TODO: This can be improved to treat different types of errors from GetUserFromBrowserSession differently
			// but we need to be able to break a potential infinite loop. To do that, we need to actually "save" the current
			// session in the store so that we can track a counter or something. For now, leaving prior approach but this
			// should be revisited once "saving" a session is implemented (which may correspond with refactoring middleware,
			// auth and session management as well).
			if browserSession != nil {
				session.Remove(browserSession, w)
				browserSession = nil
			}
			user, err = auth.GetPublicUser(site, nil)
			if err != nil {
				HandleError(ctx, w, fmt.Errorf("failed to retrieve public user: %w", err))
				return
			}
		}

		// NOTE: This is just a sanity check as the session stores should be expiring sessions based on timeout configured, however we do this for two reasons:
		// 1. the filestore does not expire/delete file based sessions currently
		// 2. Defensive check just in case
		// Also note that the current implementation does update the session when it is accessed so the timeout set upon creation is an absolute timeout and not
		// a rolling timeout.
		// TODO:
		// 1. Implement a background cleaner for the filestore that will remove expired sessions
		// 2. Implement a rolling timeout for the session stores so that the timeout is based on accessed and not created time
		if browserSession != nil && sess.IsExpired(browserSession) {
			session.Remove(browserSession, w)
			browserSession = nil
			user, err = auth.GetPublicUser(site, nil)
			if err != nil {
				HandleError(ctx, w, fmt.Errorf("failed to retrieve public user: %w", err))
				return
			}
		}

		if browserSession == nil {
			browserSession = sess.CreateBrowserSession(w, user, site)
		}

		s, err := auth.GetSessionFromUser(browserSession.ID(), user, site)
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

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

			s, err := auth.CreateSessionFromUser(user, site)
			if err != nil {
				HandleError(ctx, w, fmt.Errorf("failed to create session: %w", err))
				return
			}
			setSession(ctx, s)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		// Do we have a session id?
		browserSession, err := getBrowserSession(r)
		if err != nil {
			HandleError(ctx, w, err)
			return
		}

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
			browserSession = sess.CreateBrowserSession(w, r, user, site)
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

// Retrieves the browser session from the request context if it exists.
// If it does not exist, the following occurs:
//  1. Check if there is a sessid cookie in the request
//  2. If no cookie, return nil browser session
//  3. If it exists, return UnauthorizedException because the cookie is invalid or has expired
//  4. If an error is encountered while retrieving the cookie, return the error
//
// This is necessary due to the way we overload the meaning of what a browser session is since it
// represents a session with our server but also represents an auth token since we store the userid &
// password, even for the public user, in the session data. This presents a race condition handling browser
// requests. For example:
//  1. Brand new user navigates to a page (no sessid cookie)
//  2. We process the request, store userid/password in session data and return a sessid cookie which acts
//     as an auth token for Public User
//  3. User goes to login page and clicks login
//  4. We proces the request, remove the sessid cookie & data that came in with the request that represents
//     the public user, create a new sessid cookie & store the data with the "actual user" and return to client
//  5. While we are completing step 4 another request comes in from the browser with the sessid of the public user
//     session created in step 2. At this point, we have removed the public user session in step 4 but the browser
//     sent this request (e.g,, for css, font, js, etc.) before it could obtain the cookie from step 5. When this
//     occurs, we create a new browser session for public user, store session data again and return that sessid
//     cookie to the browser.
//  6. The client side javascript changes window.location (e.g., from the login request) but the browser now
//     has the cookie from step 5 instead of step 4 so we end up redirecting the user back to login when the
//     request comes in for /home.
//
// In the normal course of human user interaction, this scenario does not play out because by the time the user
// clicks the "login" button, all css/js/fonts/etc. have been served as the original public user. However, if a user
// is incredibly fast or more specifically, during e2e tests where it's a computer doing the work, the situation
// manifests.
//
// There are several underlying issues/limitations with the way that we manage browser sessions and user sessions
// and the fact that they are all one in the same plus carry auth token creates the situation.
//
// The auth flows and session management need to be refactored to avoid this situation and have a more explicit
// path for the different "user" cases taking care to know that even public users may have a browser session with
// a cookie (e.g., for things like preferences, etc. at some point) but this shouldn't be co-mingled with auth
// user identification.
//
// The code is being stairstepped across multiple PRs to better align with its needs/purpose, however in the
// meantime, the below should gracefully handle the scenario described above by ensuring that when we receive
// a Cookie and do not have a session, we do not send back another cookie and instead a UnauthorizedException.
//
// To summarize, while technically possible to occur in any situation, this problem was only able to be reproduced
// in two situations:
//  1. During CI E2E tests when using electron - this was likely due to overall slower processing of CI environment
//     vs local dev machine
//  2. Locally running Cypress GUI with DevTools open (which caused source maps to be loaded creating more
//     requests and timing scenarios) and only in Electron - was not able to reproduce this with Chrome
//     or Edge
func getBrowserSession(r *http.Request) (session.Session, error) {
	browserSession := session.Get(r)
	if browserSession != nil {
		return browserSession, nil
	}
	_, err := r.Cookie(auth.BrowserSessionCookieName)
	if err == http.ErrNoCookie {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	// NOTE: We have a cookie at this point, however it may be empty or non-empty. Intentionally
	// treating them as invalid since we do not expect to have a cookie at all at this point. This
	// could be revisited and if cookie is empty string, continue prcessing as public user but
	// if the cookie is ever written to downstream, we end up in the cycle again so better
	// to just failfast here.
	return nil, exceptions.NewUnauthorizedException("not authorized")
}

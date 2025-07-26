package middleware

import (
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/thecloudmasters/uesio/pkg/meta"
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

			s, err := auth.GetSessionFromUser(user, site, "")
			if err != nil {
				HandleError(ctx, w, fmt.Errorf("failed to create session: %w", err))
				return
			}
			setSession(ctx, s)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		s, err := getSession(r, w, site)
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
//  3. If there is a sessid in the request but we do not have data in the cache, a uesio session will be built from the public user
//     but there will NOT be a browser session created. See below for details on why.
//  4. If an error is encountered while performing the above process, the error will be returned
//
// For scenario 3, this is a special case handling due to the fact that we overload the meaning of what a browser session is
// since it represents a session with our server but also represents an auth token since we store the userid/password, even for
// the public user, in the session data. This presents a race condition while handling browser requests. For example:
//  1. Brand new user navigates to a page (no sessid cookie)
//  2. We process the request, store userid/password in session data and return a sessid cookie which acts
//     as an auth token for Public User
//  3. User goes to login page and clicks login
//  4. We proces the request, remove the sessid cookie & data that came in with the request that represents
//     the public user, create a new sessid cookie & store the data with the "actual user" and return to client
//  5. While we are completing step 4 another request comes in from the browser with the sessid of the public user
//     session created in step 2. At this point, we have removed the public user session in step 4 but the browser
//     sent this request (e.g,, for css, font, js, etc.) before it could obtain the cookie from step 4. When this
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
// meantime, the below should "gracefully" handle the scenario described above by ensuring that when we receive
// a Cookie and do not have a session, we do not send back another cookie and instead process the request as
// the public user but without a "browser session" backing it (to avoid sending another cookie back down).
//
// To summarize, while technically possible to occur in any situation, the "race" condition problem was only able to be reproduced
// in two situations:
//  1. During CI E2E tests when using electron - this was likely due to overall slower processing of CI environment
//     vs local dev machine
//  2. Locally running Cypress GUI with DevTools open (which caused source maps to be loaded creating more
//     requests and timing scenarios) and only in Electron - was not able to reproduce this with Chrome
//     or Edge
//
// Lastly, note that there is one other situation that needs to be accounted for that requires us to continue to process
// the request as public user instead of simply returning an UnauthorizedException. Our cookies have a 30 day expiration,
// however our sessions have an absolute 12 hour duration. So, if a user comes back after 12 hours but prior to 30
// days, they will have a sessid so we can't just return an UnauthorizedException as they would never be able to
// access the site unless they manually cleared their cookies.
func getSession(r *http.Request, w http.ResponseWriter, site *meta.Site) (*sess.Session, error) {
	browserSession := session.Get(r)
	if browserSession != nil {
		return createSessionFromBrowserSession(browserSession, r, w, site)
	}
	_, err := r.Cookie(auth.BrowserSessionCookieName)
	if err == http.ErrNoCookie {
		return createSessionFromBrowserSession(nil, r, w, site)
	}
	if err != nil {
		return nil, err
	}
	// We have a cookie at this point, however it may be empty or non-empty but we treat them the same. We will create
	// a uesio session but without a browser session backing it.
	// IMPORTANT: Passing "" is INTENTIONAL here, we do not want a browser session in this situation in order to
	// avoid passing a new sessid to client on response.
	return createPublicUserSession(site, "")
}

func createSessionFromBrowserSession(browserSession session.Session, r *http.Request, w http.ResponseWriter, site *meta.Site) (*sess.Session, error) {
	ctx := r.Context()
	user, err := getUserFromBrowserSession(browserSession, site)
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
		slog.ErrorContext(ctx, "failed to get user from browser session: "+err.Error())
		if browserSession != nil {
			session.Remove(browserSession, w)
			browserSession = nil
		}
	}

	// NOTE: THe expired check here is just a sanity check as the session stores should be expiring sessions based on timeout configured,
	// however we do this for two reasons:
	//  1. the filestore does not expire/delete file based sessions currently
	//  2. defensive check just in case
	// Also note that the current implementation does not update the session when it is accessed so the timeout set upon creation is an
	// absolute timeout and not a rolling timeout.
	// TODO:
	// 1. Implement a background cleaner for the filestore that will remove expired sessions
	// 2. Implement a rolling timeout for the session stores so that the timeout is based on accessed and not created time
	if browserSession == nil || isExpired(browserSession) {
		if browserSession != nil {
			session.Remove(browserSession, w)
			browserSession = nil
		}
		browserSession = auth.CreateBrowserSession(w, r, user, site)
		return createPublicUserSession(site, browserSession.ID())
	}

	return auth.GetSessionFromUser(user, site, browserSession.ID())
}

func createPublicUserSession(site *meta.Site, token string) (*sess.Session, error) {
	publicUser, err := auth.GetPublicUser(site, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve public user: %w", err)
	}

	return auth.GetSessionFromUser(publicUser, site, token)
}

func getUserFromBrowserSession(browserSession session.Session, site *meta.Site) (*meta.User, error) {
	if browserSession == nil {
		return auth.GetPublicUser(site, nil)
	}
	browserSessionSite := getBrowserSessionAttribute(browserSession, "Site")
	browserSessionUser := getBrowserSessionAttribute(browserSession, "UserID")
	// Check to make sure our session site matches the site from our domain.
	if browserSessionSite != site.GetFullName() {
		return nil, fmt.Errorf("sites mismatch for user: %s", browserSessionUser)
	}
	return auth.GetCachedUserByID(browserSessionUser, site)
}

func getBrowserSessionAttribute(browserSession session.Session, key string) string {
	value, ok := browserSession.CAttr(key).(string)
	if !ok {
		return ""
	}
	return value
}

// IsExpired returns true if the browser session's last access time, plus the timeout duration,
// is prior to the current timestamp.
func isExpired(browserSession session.Session) bool {
	if browserSession == nil {
		return true
	}
	return browserSession.Accessed().Add(browserSession.Timeout()).Before(time.Now())
}

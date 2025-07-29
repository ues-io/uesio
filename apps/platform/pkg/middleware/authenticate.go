package middleware

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/alexedwards/scs/redisstore"
	"github.com/alexedwards/scs/v2"
	"github.com/alexedwards/scs/v2/memstore"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/env"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/tls"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
)

const sessionLifetime = 12 * time.Hour
const BrowserSessionCookieName = "sessid" // icza applied this name by default so we use the same one
const siteIDKey = "SiteId"
const userIDKey = "UserId"

var browserSessionManager *scs.SessionManager

func init() {
	// The localhost check here is only necessary because hurl doesn't handle secure cookies against *.localhost by default like browsers, curl, etc.
	// do. If/When they treat "localhost" as a secure connection the IsLocalHost condition can be removed.
	// TODO: File an issue with hurl regarding this.  libcurl is returning the cookie to them, its in the response, but they are not carrying it
	// forward to subsequent requests.
	allowInsecureCookies := !tls.ServeAppWithTLS() && (env.IsLocalhost() || os.Getenv("UESIO_ALLOW_INSECURE_COOKIES") == "true")
	storageType := os.Getenv("UESIO_SESSION_STORE")

	var store scs.Store
	switch storageType {
	case "redis":
		prefix := "scs:session:"
		pool, err := cache.RegisterNamespace(prefix)
		if err != nil {
			panic(fmt.Sprintf("failed to register scs redis namespace for session store: %v", err))
		}
		store = redisstore.NewWithPrefix(pool, prefix)
	case "", "memory":
		store = memstore.New()
	default:
		panic("UESIO_SESSION_STORE is an unrecognized value: " + storageType)
	}

	browserSessionManager = scs.New()
	// TODO: This mirrors prior behavior where we had a fixed 12 hour duration since we were not rolling the duration based on
	// access.  Need to decide on defaults for this and IdleTimeout.
	//browserSessionManager.IdleTimeout = TODO
	browserSessionManager.Lifetime = sessionLifetime
	browserSessionManager.Store = store
	browserSessionManager.Cookie.Name = BrowserSessionCookieName
	browserSessionManager.Cookie.Secure = !allowInsecureCookies
	browserSessionManager.ErrorFunc = func(w http.ResponseWriter, r *http.Request, err error) {
		ctlutil.HandleError(r.Context(), w, fmt.Errorf("browser session error: %w", err))
	}
}

func BrowserSessionHandler() func(next http.Handler) http.Handler {
	return browserSessionManager.LoadAndSave
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

			s, err := auth.GetSessionFromUser(ctx, user, site, "")
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
		RedirectToLoginRoute(w, r.WithContext(ctx), s, Expired)
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
	browserSiteID := browserSessionManager.GetString(ctx, siteIDKey)
	browserUserID := browserSessionManager.GetString(ctx, userIDKey)

	if browserSiteID == "" && browserUserID == "" {
		return createSessionForPublicUser(ctx, site)
	}

	if browserSiteID != site.ID {
		// TODO: Should we just clear and recover to a public session here? Technically we received
		// a request that is invalid so I think we should just reject the entire request since we
		// cannot trust it
		browserSessionManager.Destroy(ctx)
		return nil, exceptions.NewUnauthorizedException("invalid_browser_session: site_mismatch")
	}

	user, err := auth.GetCachedUserByID(browserUserID, site)
	if err == nil {
		return auth.GetSessionFromUser(ctx, user, site, browserSessionManager.Token(ctx))
	}

	if exceptions.IsType[*exceptions.NotFoundException](err) {
		return handlePriviledgeChange(ctx, nil, site)
	} else {
		return nil, err
	}
}

func getLoginRoute(session *sess.Session) (*meta.Route, error) {
	loginRoute, err := meta.NewRoute(session.GetLoginRoute())
	if err != nil {
		return nil, err
	}
	err = bundle.Load(session.Context(), loginRoute, nil, session, nil)
	if err != nil {
		return nil, err
	}
	return loginRoute, nil
}

type RedirectReason int

const (
	Expired = iota
	LoggedOut
	NoAccess
	NotFound
)

func RedirectToLoginRoute(w http.ResponseWriter, r *http.Request, session *sess.Session, reason RedirectReason) bool {
	loginRoute, err := getLoginRoute(session)
	if err != nil {
		return false
	}

	requestedPath := r.URL.RequestURI()
	redirectPath := "/" + loginRoute.Path

	if session.GetContextAppName() != loginRoute.Namespace {
		redirectPath = "/site/app/" + loginRoute.Namespace + "/" + redirectPath
	}

	loginRouteSuffix := fmt.Sprintf("%s/%s", loginRoute.Namespace, loginRoute.Path)

	// If we are going to the login route already, don't do any more redirections
	if redirectPath == requestedPath || strings.HasSuffix(requestedPath, redirectPath) || strings.HasSuffix(requestedPath, loginRouteSuffix) {
		return false
	}

	redirectStatusCode := http.StatusFound

	isHTMLRequest := strings.Contains(r.Header.Get("Accept"), "text/html")
	refererHeader := r.Header.Get("Referer")

	if !isHTMLRequest {
		// If this is a Fetch / XHR request, we want to send the user back to the Referer URL
		// (i.e. the URL in the browser URL bar), NOT the URL being fetched in the XHR,
		// after the user logs in.
		if refererHeader != "" {
			requestedPath = refererHeader
		}
		// We need to send a 200 status, not 302, to prevent fetch API
		// from attempting to do its bad redirect behavior, which is not controllable.
		// (Zach: I tried using "manual" and "error" for the fetch "redirect" properties,
		// but none of them provided the ability to capture the location header from the server
		// WITHOUT doing some unwanted browser behavior).
		redirectStatusCode = http.StatusOK
	}

	if requestedPath != "" && requestedPath != "/" {
		redirectPath = redirectPath + "?r=" + url.QueryEscape(requestedPath)
	}
	if reason == Expired {
		if strings.Contains(redirectPath, "?") {
			redirectPath = redirectPath + "&"
		} else {
			redirectPath = redirectPath + "?"
		}
		redirectPath = redirectPath + "expired=true"
	}

	http.Redirect(w, r, redirectPath, redirectStatusCode)
	return true
}

func ProcessLogin(ctx context.Context, user *meta.User, site *meta.Site) (*sess.Session, error) {
	return handlePriviledgeChange(ctx, user, site)
}

func ProcessLogout(ctx context.Context, site *meta.Site) (*sess.Session, error) {
	return handlePriviledgeChange(ctx, nil, site)
}

// Creates a uesio session from a user and site. If user is nil, the public user for the site is used.
func handlePriviledgeChange(ctx context.Context, user *meta.User, site *meta.Site) (*sess.Session, error) {
	// We may or may not renew the token so we destroy data either way. For situations where we are going to
	// renew, since we only track UserID and SiteID and we set them below, destroying the data is OK. However,
	// if/when we add other data to the store for the session, we may need/want to carry it forward (e.g.,
	// preferences, etc.)
	browserSessionManager.Destroy(ctx)

	if user == nil {
		return createSessionForPublicUser(ctx, site)
	}

	browserSessionManager.RenewToken(ctx)
	browserSessionManager.Put(ctx, siteIDKey, site.ID)
	browserSessionManager.Put(ctx, userIDKey, user.ID)
	return auth.GetSessionFromUser(ctx, user, site, browserSessionManager.Token(ctx))
}

func createSessionForPublicUser(ctx context.Context, site *meta.Site) (*sess.Session, error) {
	publicUser, err := auth.GetPublicUser(site, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve public user: %w", err)
	}
	return auth.GetSessionFromUser(ctx, publicUser, site, "")
}

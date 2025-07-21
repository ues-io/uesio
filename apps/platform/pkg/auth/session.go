package auth

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/alexedwards/scs/redisstore"
	"github.com/alexedwards/scs/v2"
	"github.com/alexedwards/scs/v2/memstore"
	"github.com/gofrs/uuid/v5"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/env"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/tls"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"golang.org/x/crypto/bcrypt"
)

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
	browserSessionManager.Lifetime = sess.SessionLifetime
	browserSessionManager.Store = store
	browserSessionManager.Cookie.Name = "sessid"
	browserSessionManager.Cookie.Secure = !allowInsecureCookies
	browserSessionManager.ErrorFunc = func(w http.ResponseWriter, r *http.Request, err error) {
		ctlutil.HandleError(r.Context(), w, fmt.Errorf("browser session error: %w", err))
	}
}

func BrowserSession() func(next http.Handler) http.Handler {
	return browserSessionManager.LoadAndSave
}

func GetUserFromAuthToken(token string, site *meta.Site) (*meta.User, error) {
	// Split the token on the ":" character
	cutToken, ok := strings.CutPrefix(token, "ues_")
	if !ok {
		return nil, errors.New("the api key you are trying to log in with is invalid")
	}
	id := cutToken[:8]
	key := cutToken[8:]

	adminSession := sess.GetAnonSession(context.Background(), site)
	loginmethod, err := GetLoginMethod(id, "uesio/core.apikey", nil, adminSession)
	if err != nil || loginmethod == nil {
		return nil, exceptions.NewBadRequestException("the api key you are trying to log in with does not exist", nil)
	}
	err = bcrypt.CompareHashAndPassword([]byte(loginmethod.Hash), []byte(key))
	if err != nil {
		return nil, exceptions.NewUnauthorizedException("the api key you are trying to log in with is invalid")
	}

	return GetUserByID(loginmethod.User.ID, adminSession, nil)
}

func CreateSessionFromBrowserSession(ctx context.Context, site *meta.Site) (*sess.Session, error) {
	browserSiteID := browserSessionManager.GetString(ctx, siteIDKey)
	browserUserID := browserSessionManager.GetString(ctx, userIDKey)

	if browserSiteID == "" && browserUserID == "" {
		return handlePriviledgeChange(ctx, nil, site)
	}

	if browserSiteID == "" || browserUserID == "" {
		// TODO: Should we just clear and recover to a public session here? Technically we received
		// a request that is invalid so I think we should just reject the entire request since we
		// cannot trust it
		browserSessionManager.Destroy(ctx)
		return nil, exceptions.NewForbiddenException("invalid_browser_session: unexpected_data_detected")
	}

	if browserSiteID != site.ID {
		// TODO: Should we just clear and recover to a public session here? Technically we received
		// a request that is invalid so I think we should just reject the entire request since we
		// cannot trust it
		browserSessionManager.Destroy(ctx)
		return nil, exceptions.NewForbiddenException("invalid_browser_session: site_mismatch")
	}

	user, err := GetCachedUserByID(browserUserID, site)
	if err == nil {
		return getSessionFromUser(browserSessionManager.Token(ctx), user, site)
	}

	if exceptions.IsType[*exceptions.NotFoundException](err) {
		return handlePriviledgeChange(ctx, nil, site)
	} else {
		return nil, err
	}
}

func CreateSessionFromUser(user *meta.User, site *meta.Site) (*sess.Session, error) {
	// We are creating a Uesio Session (sess.Session) here, not a browser session (session.Session).
	// but we still want to ensure we have a SessionID so we use a UUID to differentiate the session
	// ID format from one that was created from a browser session. We use v4 for randomness since
	// these don't need to be sorted or stored.
	// TODO: Refactor code to be more explicit about a "UesioSession" vs. a "BrowserSession" since
	// variables and function names all use "Session" which leads to a lot of confusion unless you
	// pay vary close attention to the types.
	sessionID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}
	return getSessionFromUser(sessionID.String(), user, site)
}

func getSessionFromUser(sessionID string, user *meta.User, site *meta.Site) (*sess.Session, error) {
	s := sess.New(sessionID, user, site)
	return s, hydrateUserPermissions(user, s)
}

func hydrateUserPermissions(user *meta.User, session *sess.Session) error {
	profileKey := user.Profile
	if profileKey == "" {
		return errors.New("no profile found in session")
	}
	profile, err := datasource.LoadAndHydrateProfile(profileKey, session)
	if err != nil {
		return fmt.Errorf("error loading profile: %s : %w", profileKey, err)
	}
	user.Permissions = profile.FlattenPermissions()
	user.ProfileRef = profile
	return nil
}

func GetCachedUserByID(userid string, site *meta.Site) (*meta.User, error) {

	// Get Cache site info for the host
	cachedUser, ok := getUserCache(userid, site)
	if ok {
		return cachedUser, nil
	}

	s := sess.GetAnonSession(context.Background(), site)

	user, err := GetUserWithPictureByID(userid, s, nil)
	if err != nil {
		return nil, err
	}

	err = setUserCache(userid, site, user)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// Creates a uesio session from a user and site. If user is nil, the public user for the site is used.
func handlePriviledgeChange(ctx context.Context, user *meta.User, site *meta.Site) (*sess.Session, error) {
	// Being defensive here and clearing out any data associated with the session. We currently only
	// mantain SiteID and UserID so the net effect is zero since they are just established. However, if
	// the session is used to track other things (e.g., preferences), we may or may not want to destroy
	// all existing data in the session in the future.
	browserSessionManager.Destroy(ctx)
	browserSessionManager.RenewToken(ctx)

	if user == nil {
		// NOTE: For backwards compat, we will generate a browser session with the public user id for the current site. However, there really
		// is no need to have a browser session backed in redis for the public user since we are only tracking userid & siteid currently. Having it backed
		// in redis forces us to retrieve from redis on every request just to get the information we already know via GetPublicUser. The only downside
		// to not having a browser session is that when we create the sess.Session, we will not have an ID to assign it - it's effectively an anonymous
		// session. This is likely OK and we used to have scenarios that would not assign an ID for sess.Session until some recent PRs enforced having
		// something for ID even if it was a uuid to diferentiate the type of session. If we don't back the public user session in redis, we avoid
		// all the calls to redis for every public user request (page, css, fonts, etc.) and avoid user cache lookups because we're always going to end up
		// with the equivalent of GetPublicUser anyway.
		// TODO: Consider not having a browser session for public user flows.
		if publicUser, err := GetPublicUser(site, nil); err != nil {
			return nil, err
		} else {
			user = publicUser
		}
	}

	browserSessionManager.Put(ctx, siteIDKey, site.ID)
	browserSessionManager.Put(ctx, userIDKey, user.ID)
	return getSessionFromUser(browserSessionManager.Token(ctx), user, site)
}

func HandleLoginSuccess(ctx context.Context, user *meta.User, site *meta.Site) (*sess.Session, error) {
	return handlePriviledgeChange(ctx, user, site)
}

func HandleLogoutSuccess(ctx context.Context, site *meta.Site) (*sess.Session, error) {
	return handlePriviledgeChange(ctx, nil, site)
}

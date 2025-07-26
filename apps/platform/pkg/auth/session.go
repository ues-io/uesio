package auth

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/alexedwards/scs/redisstore"
	"github.com/alexedwards/scs/v2"
	"github.com/alexedwards/scs/v2/memstore"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/env"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/tls"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

const SessionLifetime = 12 * time.Hour
const BrowserSessionCookieName = "sessid" // icza applied this name by default so we use the same one
const SiteIDKey = "SiteId"
const UserIDKey = "UserId"

var BrowserSessionManager *scs.SessionManager

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

	BrowserSessionManager = scs.New()
	// TODO: This mirrors prior behavior where we had a fixed 12 hour duration since we were not rolling the duration based on
	// access.  Need to decide on defaults for this and IdleTimeout.
	//browserSessionManager.IdleTimeout = TODO
	BrowserSessionManager.Lifetime = SessionLifetime
	BrowserSessionManager.Store = store
	BrowserSessionManager.Cookie.Name = BrowserSessionCookieName
	BrowserSessionManager.Cookie.Secure = !allowInsecureCookies
	BrowserSessionManager.Cookie.SameSite = 0
	BrowserSessionManager.ErrorFunc = func(w http.ResponseWriter, r *http.Request, err error) {
		ctlutil.HandleError(r.Context(), w, fmt.Errorf("browser session error: %w", err))
	}
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

func GetSessionFromUser(user *meta.User, site *meta.Site, token string) (*sess.Session, error) {
	s := sess.NewWithAuthToken(user, site, token)
	return s, HydrateUserPermissions(user, s)
}

func HydrateUserPermissions(user *meta.User, session *sess.Session) error {
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

func ProcessLogin(ctx context.Context, user *meta.User, site *meta.Site) (*sess.Session, error) {
	return HandlePriviledgeChange(ctx, user, site)
}

func ProcessLogout(ctx context.Context, site *meta.Site) (*sess.Session, error) {
	return HandlePriviledgeChange(ctx, nil, site)
}

// Creates a uesio session from a user and site. If user is nil, the public user for the site is used.
func HandlePriviledgeChange(ctx context.Context, user *meta.User, site *meta.Site) (*sess.Session, error) {
	// Being defensive here and clearing out any data associated with the session. We currently only
	// mantain SiteID and UserID so the net effect is zero since they are just established. However, if
	// the session is used to track other things (e.g., preferences), we may or may not want to destroy
	// all existing data in the session in the future.
	BrowserSessionManager.Destroy(ctx)
	BrowserSessionManager.RenewToken(ctx)

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

	BrowserSessionManager.Put(ctx, SiteIDKey, site.ID)
	BrowserSessionManager.Put(ctx, UserIDKey, user.ID)
	return GetSessionFromUser(user, site, BrowserSessionManager.Token(ctx))
}

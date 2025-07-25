package auth

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gofrs/uuid/v5"
	"github.com/icza/session"
	"golang.org/x/crypto/bcrypt"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/env"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/tls"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

const SessionLifetime = 12 * time.Hour
const BrowserSessionCookieName = "sessid" // icza applied this name by default so we use the same one

func init() {
	session.Global.Close()
	// The localhost check here is only necessary because hurl doesn't handle secure cookies against *.localhost by default like browsers, curl, etc.
	// do. If/When they treat "localhost" as a secure connection the IsLocalHost condition can be removed.
	// TODO: File an issue with hurl regarding this.  libcurl is returning the cookie to them, its in the response, but they are not carrying it
	// forward to subsequent requests.
	allowInsecureCookies := !tls.ServeAppWithTLS() && (env.IsLocalhost() || os.Getenv("UESIO_ALLOW_INSECURE_COOKIES") == "true")
	storageType := os.Getenv("UESIO_SESSION_STORE")

	var store session.Store
	switch storageType {
	case "filesystem":
		store = NewFSSessionStore()
	case "redis":
		store = NewRedisSessionStore()
	case "", "memory":
		store = session.NewInMemStore()
	default:
		panic("UESIO_SESSION_STORE is an unrecognized value: " + storageType)
	}

	options := &session.CookieMngrOptions{
		AllowHTTP:        allowInsecureCookies,
		SessIDCookieName: BrowserSessionCookieName,
	}

	session.Global = session.NewCookieManagerOptions(store, options)
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
	return GetSessionFromUser(sessionID.String(), user, site)
}

func GetSessionFromUser(sessionID string, user *meta.User, site *meta.Site) (*sess.Session, error) {
	s := sess.New(sessionID, user, site)
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

func CreateBrowserSession(w http.ResponseWriter, r *http.Request, user *meta.User, site *meta.Site) session.Session {
	sess := session.NewSessionOptions(&session.SessOptions{
		CAttrs: map[string]any{
			"Site":   site.GetFullName(),
			"UserID": user.ID,
		},
		// TODO: Make Session timeout configurable by App/Site
		// https://github.com/TheCloudMasters/uesio/issues/2643
		Timeout: SessionLifetime,
	})
	browserSession := session.Get(r)
	if browserSession != nil {
		session.Remove(browserSession, w)
	}
	// Remove any previous set-cookie headers
	// icza updates existing to "" and then its Add method
	// appends so we end up with two Set-Cookie headers. This ensures
	// we only have one and it's the current one
	w.Header().Del("Set-Cookie")
	session.Add(sess, w)
	return sess
}

func ProcessLogin(w http.ResponseWriter, r *http.Request, user *meta.User, site *meta.Site) *sess.Session {
	return sess.New(CreateBrowserSession(w, r, user, site).ID(), user, site)
}

func ProcessLogout(w http.ResponseWriter, r *http.Request, publicUser *meta.User, s *sess.Session) *sess.Session {
	// Login as the public user - Login will logout the current user
	return ProcessLogin(w, r, publicUser, s.GetSiteSession().GetSite())
}

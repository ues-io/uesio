package auth

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/preload"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func GetLoginRedirectResponse(w http.ResponseWriter, r *http.Request, user *meta.User, session *sess.Session) (*preload.LoginResponse, error) {

	site := session.GetSite()

	err := HydrateUserPermissions(user, session)
	if err != nil {
		return nil, err
	}

	profile := user.ProfileRef

	redirectKey := site.GetAppBundle().HomeRoute

	if profile.HomeRoute != "" {
		redirectKey = profile.HomeRoute
	}
	// If we had an old session, remove it.
	w.Header().Del("set-cookie")
	session = sess.Login(w, user, site)

	// Check for redirect parameter on the referrer
	referer, err := url.Parse(r.Referer())
	if err != nil {
		return nil, err
	}

	redirectPath := referer.Query().Get("r")

	var redirectNamespace, redirectRoute string

	if redirectPath == "" {
		if redirectKey == "" {
			return nil, errors.New("No redirect route specified")
		}
		redirectNamespace, redirectRoute, err = meta.ParseKey(redirectKey)
		if err != nil {
			return nil, err
		}
	}

	return &preload.LoginResponse{
		User: preload.GetUserMergeData(session),
		// We'll want to read this from a setting somewhere
		RedirectRouteNamespace: redirectNamespace,
		RedirectRouteName:      redirectRoute,
		RedirectPath:           redirectPath,
		SessionId:              session.GetSessionId(),
	}, nil
}

func LoginRedirectResponse(w http.ResponseWriter, r *http.Request, user *meta.User, session *sess.Session) {

	response, err := GetLoginRedirectResponse(w, r, user, session)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	filejson.RespondJSON(w, r, response)
}

func GetUserFromFederationID(authSourceID string, federationID string, session *sess.Session) (*meta.User, error) {

	if session.GetWorkspace() != nil {
		return nil, exceptions.NewBadRequestException("Login isn't currently supported for workspaces")
	}

	adminSession := sess.GetAnonSessionFrom(session)

	// 4. Check for Existing User
	loginMethod, err := GetLoginMethod(federationID, authSourceID, adminSession)
	if err != nil {
		return nil, errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	if loginMethod == nil {
		return nil, exceptions.NewNotFoundException("No account found with this login method")
	}

	user, err := GetUserByID(loginMethod.User.ID, adminSession, nil)
	if err != nil {
		return nil, exceptions.NewNotFoundException("failed Getting user Data: " + err.Error())
	}

	return user, nil
}

func Login(w http.ResponseWriter, r *http.Request, authSourceID string, session *sess.Session) {
	conn, err := GetAuthConnection(authSourceID, nil, datasource.GetSiteAdminSession(session))
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	conn.Login(w, r)
}

func RequestLogin(w http.ResponseWriter, r *http.Request, authSourceID string, session *sess.Session) {
	conn, err := GetAuthConnection(authSourceID, nil, datasource.GetSiteAdminSession(session))
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	conn.RequestLogin(w, r)
}

func getLoginRoute(session *sess.Session) (*meta.Route, error) {
	loginRoute, err := meta.NewRoute(session.GetLoginRoute())
	if err != nil {
		return nil, err
	}
	err = bundle.Load(loginRoute, session, nil)
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

	requestedPath := r.URL.Path
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
		redirectPath = redirectPath + "?r=" + requestedPath
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

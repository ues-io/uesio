package auth

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bundle"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type AuthRequestError struct {
	message string
}

func NewAuthRequestError(message string) *AuthRequestError {
	return &AuthRequestError{
		message: message,
	}
}

func (e *AuthRequestError) Error() string {
	return e.message
}

type NotAuthorizedError struct {
	message string
}

func NewNotAuthorizedError(message string) *NotAuthorizedError {
	return &NotAuthorizedError{
		message: message,
	}
}

func (e *NotAuthorizedError) Error() string {
	return e.message
}

func GetUserFromFederationID(authSourceID string, federationID string, session *sess.Session) (*meta.User, error) {

	if session.GetWorkspace() != nil {
		return nil, NewAuthRequestError("Login isn't currently supported for workspaces")
	}

	adminSession := sess.GetAnonSession(session.GetSite())

	// 4. Check for Existing User
	loginmethod, err := GetLoginMethod(federationID, authSourceID, adminSession)
	if err != nil {
		return nil, errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	if loginmethod == nil {
		return nil, NewAuthRequestError("No account found with this login method")
	}

	user, err := GetUserByID(loginmethod.User.ID, adminSession, nil)
	if err != nil {
		return nil, errors.New("failed Getting user Data: " + err.Error())
	}

	return user, nil
}

func Login(authSourceID string, payload map[string]interface{}, session *sess.Session) (*meta.User, error) {
	conn, err := GetAuthConnection(authSourceID, nil, session)
	if err != nil {
		return nil, err
	}
	return conn.Login(payload)
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

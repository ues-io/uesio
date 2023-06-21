package auth

import (
	"errors"
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bundle"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getUserFromClaims(authSourceID string, claims *AuthenticationClaims, session *sess.Session) (*meta.User, error) {
	// Bump our permissions a bit so we can make the next two queries
	session.SetPermissions(&meta.PermissionSet{
		CollectionRefs: map[string]meta.CollectionPermission{
			"uesio/core.user":        {Read: true},
			"uesio/core.userfile":    {Read: true},
			"uesio/core.loginmethod": {Read: true},
		},
	})

	// 4. Check for Existing User
	loginmethod, err := GetLoginMethod(claims, authSourceID, session)
	if err != nil {
		return nil, errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	if loginmethod == nil {
		return nil, errors.New("no Login Method found that matches your claims")
	}

	user, err := GetUserByID(loginmethod.User.ID, session, nil)
	if err != nil {
		return nil, errors.New("failed Getting user Data: " + err.Error())
	}

	return user, nil
}

func Login(authSourceID string, payload map[string]interface{}, session *sess.Session) (*meta.User, error) {
	conn, err := GetAuthConnection(authSourceID, session)
	if err != nil {
		return nil, err
	}

	claims, err := conn.Login(payload, session)
	if err != nil {
		return nil, err
	}

	return getUserFromClaims(authSourceID, claims, session)

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

func RedirectToLoginRoute(w http.ResponseWriter, r *http.Request, session *sess.Session) bool {
	loginRoute, err := getLoginRoute(session)
	if err == nil {
		requestedPath := r.URL.Path
		redirectPath := "/" + loginRoute.Path
		if redirectPath != requestedPath {

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
			http.Redirect(w, r, redirectPath, redirectStatusCode)
			return true
		}
	}
	return false
}

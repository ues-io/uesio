package controller

import (
	"fmt"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/routing"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

	"github.com/thecloudmasters/uesio/pkg/auth"
)

func Signup(w http.ResponseWriter, r *http.Request) {
	// See comments in ensurePublicSession for why we do this.
	session, err := ensurePublicSession(r.Context())
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	site := session.GetSite()

	payload, err := getAuthRequest(r)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid signup request body", nil))
		return
	}

	systemSession, err := auth.GetSystemSession(r.Context(), site, nil)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, fmt.Errorf("Signup failed: %w", err))
		return
	}

	signupMethod, err := auth.GetSignupMethod(r.Context(), getSignupMethodID(mux.Vars(r)), session)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, fmt.Errorf("Signup failed: %w", err))
		return
	}

	user, err := auth.Signup(r.Context(), signupMethod, payload, systemSession)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	if signupMethod.AutoLogin {
		LoginRedirectResponse(w, r, user, session)
		return
	}

	// do not use "user" here since they aren't validated yet
	// we need permissions for route lookup
	err = auth.HydrateUserPermissions(r.Context(), session.GetSiteUser(), session)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	route, err := routing.GetRouteFromKey(r.Context(), signupMethod.LandingRoute, session)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	// session ID is intentionally blank here because we have intentionally not created a browser session
	// since the user is required to login.
	redirectPath, err := NewLoginResponseFromRoute(nil, session, route)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	filejson.RespondJSON(w, r, redirectPath)
}

// ConfirmSignUp directly confirms the user, logs them in, and redirects them to the Home route, without any manual intervention
func ConfirmSignUp(w http.ResponseWriter, r *http.Request) {
	// See comments in ensurePublicSession for why we do this.
	session, err := ensurePublicSession(r.Context())
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	site := session.GetSite()
	queryParams := r.URL.Query()
	username := queryParams.Get("username")
	signupMethodId := getSignupMethodID(mux.Vars(r))
	systemSession, err := auth.GetSystemSession(r.Context(), site, nil)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	// Convert all query-string params into a map of values to send to the signup confirmation method
	if err = auth.ConfirmSignUp(r.Context(), systemSession, signupMethodId, auth.AuthRequest{
		"username":         username,
		"verificationcode": queryParams.Get("code"),
	}, site); err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	// If signup confirmation succeeded, go ahead and log the user in
	user, err := auth.GetUserByKey(r.Context(), username, systemSession, nil)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	// Log the user in
	_, err = middleware.ProcessLogin(r.Context(), user, site)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	// Redirect to studio home
	http.Redirect(w, r, "/", http.StatusFound)
}

package controller

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/routing"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Signup(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	site := session.GetSite()

	var payload map[string]any
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid signup request body", nil))
		return
	}

	systemSession, err := auth.GetSystemSession(session.Context(), site, nil)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, fmt.Errorf("Signup failed: %w", err))
		return
	}

	signupMethod, err := auth.GetSignupMethod(getSignupMethodID(mux.Vars(r)), session)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, fmt.Errorf("Signup failed: %w", err))
		return
	}

	user, err := auth.Signup(signupMethod, payload, systemSession)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	if signupMethod.AutoLogin {
		auth.LoginRedirectResponse(w, r, user, systemSession)
		return
	}

	route, err := routing.GetRouteFromKey(signupMethod.LandingRoute, systemSession)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	redirectPath, err := url.JoinPath("/", route.Path)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	filejson.RespondJSON(w, r, auth.NewLoginResponse(nil, "", redirectPath))

}

// ConfirmSignUp directly confirms the user, logs them in, and redirects them to the Home route, without any manual intervention
func ConfirmSignUp(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	ctx := session.Context()
	site := session.GetSite()
	queryParams := r.URL.Query()
	username := queryParams.Get("username")
	signupMethodId := getSignupMethodID(mux.Vars(r))
	systemSession, err := auth.GetSystemSession(ctx, site, nil)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	// Convert all query-string params into a map of values to send to the signup confirmation method
	if err = auth.ConfirmSignUp(systemSession, signupMethodId, map[string]any{
		"username":         username,
		"verificationcode": queryParams.Get("code"),
	}, site); err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	// If signup confirmation succeeded, go ahead and log the user in
	user, err := auth.GetUserByKey(username, systemSession, nil)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	// If we had an old session, remove it.
	w.Header().Del("set-cookie")
	// Log the user in
	sess.Login(w, user, site)
	// Redirect to studio home
	http.Redirect(w, r, "/", http.StatusFound)
}

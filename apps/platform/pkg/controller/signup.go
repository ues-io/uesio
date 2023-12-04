package controller

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/routing"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Signup(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	site := session.GetSite()

	var payload map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		HandleError(w, exceptions.NewBadRequestException("invalid signup request body"))
		return
	}

	systemSession, err := auth.GetSystemSession(site, nil)
	if err != nil {
		HandleError(w, errors.New("Signup failed: "+err.Error()))
		return
	}

	signupMethod, err := auth.GetSignupMethod(getSignupMethodID(mux.Vars(r)), session)
	if err != nil {
		HandleError(w, errors.New("Signup failed: "+err.Error()))
		return
	}

	user, err := auth.Signup(signupMethod, payload, systemSession)
	if err != nil {
		HandleError(w, err)
		return
	}

	if signupMethod.AutoLogin {
		loginRedirectResponse(w, r, user, systemSession)
		return
	}

	redirectRouteNamespace, redirectRouteName, err := meta.ParseKey(signupMethod.LandingRoute)
	if err != nil {
		HandleError(w, err)
		return
	}

	file.RespondJSON(w, r, &routing.LoginResponse{
		RedirectRouteNamespace: redirectRouteNamespace,
		RedirectRouteName:      redirectRouteName,
	})

}

// ConfirmSignUp directly confirms the user, logs them in, and redirects them to the Home route, without any manual intervention
func ConfirmSignUp(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	site := session.GetSite()
	queryParams := r.URL.Query()
	username := queryParams.Get("username")
	signupMethodId := getSignupMethodID(mux.Vars(r))

	// Convert all query-string params into a map of values to send to the signup confirmation method
	err := auth.ConfirmSignUp(signupMethodId, map[string]interface{}{
		"username":         username,
		"verificationcode": queryParams.Get("code"),
	}, site)

	if err != nil {
		HandleError(w, err)
		return
	}

	systemSession, err := auth.GetSystemSession(site, nil)
	if err != nil {
		HandleError(w, err)
		return
	}

	// If signup confirmation succeeded, go ahead and log the user in
	user, err := auth.GetUserByKey(username, systemSession, nil)
	if err != nil {
		HandleError(w, err)
		return
	}

	// If we had an old session, remove it.
	w.Header().Del("set-cookie")
	// Log the user in
	sess.Login(w, user, site)
	// Redirect to studio home
	http.Redirect(w, r, "/", http.StatusFound)
}

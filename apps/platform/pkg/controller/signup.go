package controller

import (
	"encoding/json"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/routing"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Signup(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	site := session.GetSite()

	var payload map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.Log(msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	signupMethod, err := auth.Signup(getSignupMethodID(mux.Vars(r)), payload, site)
	if err != nil {
		signupInternalServerError(w, err)
		return
	}

	redirectRouteNamespace, redirectRouteName, err := meta.ParseKey(signupMethod.LandingRoute)
	if err != nil {
		signupInternalServerError(w, err)
		return
	}

	file.RespondJSON(w, r, &routing.LoginResponse{
		RedirectRouteNamespace: redirectRouteNamespace,
		RedirectRouteName:      redirectRouteName,
	})

}

func signupInternalServerError(w http.ResponseWriter, err error) {
	msg := "Signup failed: " + err.Error()
	logger.Log(msg, logger.ERROR)
	http.Error(w, msg, http.StatusInternalServerError)
}

// ConfirmSignUpV2 directly confirms the user, logs them in, and redirects them to the Home route, without any manual intervention
func ConfirmSignUpV2(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	site := session.GetSite()

	username := r.URL.Query().Get("username")
	verificationCode := r.URL.Query().Get("code")

	signupMethodId := getSignupMethodID(mux.Vars(r))

	// Convert all query-string params into a map of values to send to the signup confirmation method
	payload := map[string]interface{}{
		"username":         username,
		"verificationcode": verificationCode,
	}

	err := auth.ConfirmSignUp(signupMethodId, payload, site)

	// TODO: Can we do something other than 500 here? Detect bad verification code perhaps?
	// a 5xx error here is not appropriate if the verification code was wrong, expected params were wrong, etc.

	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	systemSession, err := auth.GetSystemSession(site, nil)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// If signup confirmation succeeded, go ahead and log the user in
	user, err := auth.GetUserByKey(username, systemSession, nil)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// If we had an old session, remove it.
	w.Header().Del("set-cookie")
	// Log the user in
	sess.Login(w, user, site)
	// Redirect to studio home
	http.Redirect(w, r, "/", http.StatusFound)
}

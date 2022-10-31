package controller

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Signup(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	site := session.GetSite()

	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]

	var payload map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	signupMethod, err := auth.Signup(namespace, name, payload, site)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	publicUser, err := auth.GetPublicUser(site, nil)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	//Use the Guest user since the user might not be confirmed yet
	redirectResponse(w, r, signupMethod.LandingRoute, publicUser, site)

}

func ConfirmSignUp(w http.ResponseWriter, r *http.Request) {

	var ConfirmSignupRequest map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&ConfirmSignupRequest)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	s := middleware.GetSession(r)
	err = auth.ConfirmSignUp(getAuthSourceID(mux.Vars(r)), ConfirmSignupRequest, s)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

}

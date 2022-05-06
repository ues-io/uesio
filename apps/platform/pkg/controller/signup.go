package controller

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Signup(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	site := session.GetSite()
	vars := mux.Vars(r)
	signupMethodNamespace := vars["namespace"]
	signupMethodName := vars["name"]

	signupMethod, err := meta.NewSignupMethod(signupMethodNamespace + "." + signupMethodName)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}
	err = bundle.Load(signupMethod, session)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	authconn, err := auth.GetAuthConnection(signupMethod.AuthSource, session)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	var payload map[string]string
	err = json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	//for the studio is mandatory move there
	//get username for google from the body or default the email
	username, ok := payload["username"]
	if !ok {
		msg := "Signup failed: username is required"
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	//TO-DO
	//username/password (cognito) or token (google)
	//for congnito create a new user in cognito autoprovisioning??
	//for google login it's fine

	//authconn.Signup() prepare the username adding the site in front

	// to get the claims based on the map that is send in
	claims, err := authconn.Login(payload, session)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	err = auth.CreateUser(username, claims, signupMethod, site)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	user, err := auth.GetUserByID(username, session)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	err = auth.CreateLoginMethod(user, signupMethod, site, claims)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	//redirect

}

package controller

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func CreateLogin(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)

	var payload map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		msg := "Create Login failed: " + err.Error()
		logger.Log(msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	signupMethod, err := auth.GetSignupMethod(getSignupMethodID(mux.Vars(r)), session)
	if err != nil {
		msg := "Create Login failed: " + err.Error()
		logger.Log(msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	err = auth.CreateLogin(signupMethod, payload, session)
	if err != nil {
		msg := "Create Login failed: " + err.Error()
		logger.Log(msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

}

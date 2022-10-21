package controller

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func ForgotPassword(w http.ResponseWriter, r *http.Request) {

	var ForgotPasswordRequest map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&ForgotPasswordRequest)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	s := middleware.GetSession(r)
	err = auth.ForgotPassword(getAuthSourceID(mux.Vars(r)), ForgotPasswordRequest, s)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

}

func ConfirmForgotPassword(w http.ResponseWriter, r *http.Request) {

	var ConfirmForgotPasswordRequest map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&ConfirmForgotPasswordRequest)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	s := middleware.GetSession(r)
	err = auth.ConfirmForgotPassword(getAuthSourceID(mux.Vars(r)), ConfirmForgotPasswordRequest, s)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

}

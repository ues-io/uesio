package controller

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func getSignupMethodID(vars map[string]string) string {
	signupMethodNamespace := vars["namespace"]
	signupMethodName := vars["name"]
	return signupMethodNamespace + "." + signupMethodName
}

func ForgotPassword(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	site := session.GetContextSite()

	var payload map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		slog.Error(msg)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	err = auth.ForgotPassword(getSignupMethodID(mux.Vars(r)), payload, site)
	if err != nil {
		slog.Error(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

}

func ConfirmForgotPassword(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	site := session.GetSite()

	var payload map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		slog.Error(msg)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	err = auth.ConfirmForgotPassword(getSignupMethodID(mux.Vars(r)), payload, site)
	if err != nil {
		slog.Error(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

}

package controller

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
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
		HandleError(w, exceptions.NewBadRequestException("invalid request body: "+err.Error()))
		return
	}

	err = auth.ForgotPassword(getSignupMethodID(mux.Vars(r)), payload, site)
	if err != nil {
		HandleError(w, err)
		return
	}

}

func ConfirmForgotPassword(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	site := session.GetSite()

	var payload map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		HandleError(w, exceptions.NewBadRequestException("invalid request body: "+err.Error()))
		return
	}

	err = auth.ConfirmForgotPassword(getSignupMethodID(mux.Vars(r)), payload, site)
	if err != nil {
		HandleError(w, err)
		return
	}

}

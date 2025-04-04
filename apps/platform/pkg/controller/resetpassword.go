package controller

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func getSignupMethodID(vars map[string]string) string {
	signupMethodNamespace := vars["namespace"]
	signupMethodName := vars["name"]
	return signupMethodNamespace + "." + signupMethodName
}

func ResetPassword(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	site := session.GetContextSite()

	var payload map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("invalid request body", err))
		return
	}

	_, err = auth.ResetPassword(session.Context(), getAuthSourceID(mux.Vars(r)), payload, site)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}

}

func ConfirmResetPassword(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	site := session.GetSite()

	var payload map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("invalid request body", err))
		return
	}

	user, err := auth.ConfirmResetPassword(session.Context(), getAuthSourceID(mux.Vars(r)), payload, site)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	auth.LoginRedirectResponse(w, r, user, session)

}

package controller

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func getSignupMethodID(vars map[string]string) string {
	signupMethodNamespace := vars["namespace"]
	signupMethodName := vars["name"]
	return signupMethodNamespace + "." + signupMethodName
}

func ResetPassword(w http.ResponseWriter, r *http.Request) {
	// See comments in ensurePublicSession for why we do this.
	session, err := ensurePublicSession(r.Context())
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	site := session.GetContextSite()

	var payload map[string]any
	err = json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid request body", err))
		return
	}

	_, err = auth.ResetPassword(session.Context(), getAuthSourceID(mux.Vars(r)), payload, site)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
}

func ConfirmResetPassword(w http.ResponseWriter, r *http.Request) {
	// See comments in ensurePublicSession for why we do this.
	session, err := ensurePublicSession(r.Context())
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	site := session.GetSite()

	var payload map[string]any
	err = json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid request body", err))
		return
	}

	user, err := auth.ConfirmResetPassword(session.Context(), getAuthSourceID(mux.Vars(r)), payload, site)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	LoginRedirectResponse(w, r, user, session)
}

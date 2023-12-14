package controller

import (
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func CreateLogin(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	payload, err := getParamsFromRequestBody(r)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	signupMethod, err := auth.GetSignupMethod(getSignupMethodID(mux.Vars(r)), session)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	if err = auth.CreateLogin(signupMethod, payload, session); err != nil {
		ctlutil.HandleError(w, err)
		return
	}
}

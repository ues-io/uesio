package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Logout is good
func Logout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "text/json")

	session := middlewares.GetSession(r)
	site := session.GetSite()

	session = sess.Logout(w, session, site)

	logoutResponse := &LoginResponse{
		User: GetUserMergeData(session),
		// We'll want to read this from a setting somewhere
		RedirectRouteNamespace: "uesio",
		RedirectRouteName:      "login",
	}

	err := json.NewEncoder(w).Encode(logoutResponse)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

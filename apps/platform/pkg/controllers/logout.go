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

	session, err := sess.Logout(w, session, site)
	if err != nil {
		msg := "Failed Creating Public session" + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	logoutResponse := &LoginResponse{
		User: GetUserMergeData(session.GetBrowserSession()),
		// We'll want to read this from a setting somewhere
		RedirectRouteNamespace: "uesio",
		RedirectRouteName:      "login",
	}

	err = json.NewEncoder(w).Encode(logoutResponse)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

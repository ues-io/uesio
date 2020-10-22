package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
)

// Logout is good
func Logout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "text/json")

	site := r.Context().Value(middlewares.SiteKey).(*metadata.Site)
	sess := r.Context().Value(middlewares.SessionKey).(*session.Session)

	// Remove the logged out session
	session.Remove(*sess, w)

	sess, err := auth.CreatePublicSession(site)
	if err != nil {
		msg := "Failed Creating Public session" + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}
	session.Add(*sess, w)

	logoutResponse := &LoginResponse{
		User: GetUserMergeData(sess),
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

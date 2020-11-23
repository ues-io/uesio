package controllers

import (
	"encoding/json"
	"net/http"
	"net/url"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// LoginRequest struct
type LoginRequest struct {
	Type  string
	Token string
}

// LoginResponse struct
type LoginResponse struct {
	User                   *UserMergeData `json:"user"`
	RedirectPath           string         `json:"redirectPath,omitempty"`
	RedirectRouteName      string         `json:"redirectRouteName,omitempty"`
	RedirectRouteNamespace string         `json:"redirectRouteNamespace,omitempty"`
}

// Login is good
func Login(w http.ResponseWriter, r *http.Request) {

	// 1. Parse the request object.
	var loginRequest LoginRequest
	err := json.NewDecoder(r.Body).Decode(&loginRequest)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	// 3. Get siteName from context
	s := middlewares.GetSession(r)
	site := s.GetSite()

	user, err := auth.Login(loginRequest.Type, loginRequest.Token, site)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	session := sess.Login(w, user, site)

	// Check for redirect parameter on the referrer
	referer, err := url.Parse(r.Referer())
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	redirectPath := referer.Query().Get("r")

	var redirectNamespace, redirectRoute string

	if redirectPath == "" {
		homeRoute := site.GetAppBundle().HomeRoute
		if homeRoute == "" {
			http.Error(w, "No Home Route Specfied", http.StatusInternalServerError)
			return
		}
		redirectNamespace, redirectRoute, err = metadata.ParseKey(homeRoute)
		if err != nil {
			logger.LogErrorWithTrace(r, err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	respondJSON(w, r, &LoginResponse{
		User: GetUserMergeData(session),
		// We'll want to read this from a setting somewhere
		RedirectRouteNamespace: redirectNamespace,
		RedirectRouteName:      redirectRoute,
		RedirectPath:           redirectPath,
	})

}

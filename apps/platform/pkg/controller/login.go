package controller

import (
	"encoding/json"
	"net/http"
	"net/url"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type LoginTokenRequest struct {
	Token string
}

type LoginRequest struct {
	Username string
	Password string
}

type LoginResponse struct {
	User                   *UserMergeData `json:"user"`
	RedirectPath           string         `json:"redirectPath,omitempty"`
	RedirectRouteName      string         `json:"redirectRouteName,omitempty"`
	RedirectRouteNamespace string         `json:"redirectRouteNamespace,omitempty"`
}

func getAuthSourceID(vars map[string]string) string {
	authSourceNamespace := vars["namespace"]
	authSourceName := vars["name"]
	return authSourceNamespace + "." + authSourceName
}

func makeLoginResponse(w http.ResponseWriter, r *http.Request, user *meta.User, site *meta.Site) {

	// If we had an old session, remove it.
	w.Header().Del("set-cookie")
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
		redirectNamespace, redirectRoute, err = meta.ParseKey(homeRoute)
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

func Login(w http.ResponseWriter, r *http.Request) {

	var loginRequest LoginRequest
	err := json.NewDecoder(r.Body).Decode(&loginRequest)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	s := middleware.GetSession(r)
	site := s.GetSite()

	user, err := auth.Login(getAuthSourceID(mux.Vars(r)), loginRequest.Username, loginRequest.Password, s)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	makeLoginResponse(w, r, user, site)

}

func TokenLogin(w http.ResponseWriter, r *http.Request) {

	var loginTokenRequest LoginTokenRequest
	err := json.NewDecoder(r.Body).Decode(&loginTokenRequest)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	// 3. Get siteName from context
	s := middleware.GetSession(r)
	site := s.GetSite()

	user, err := auth.TokenLogin(getAuthSourceID(mux.Vars(r)), loginTokenRequest.Token, s)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	makeLoginResponse(w, r, user, site)

}

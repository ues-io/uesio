package controller

import (
	"encoding/json"
	"net/http"
	"net/url"

	"github.com/thecloudmasters/uesio/pkg/controller/file"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/routing"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getAuthSourceID(vars map[string]string) string {
	authSourceNamespace := vars["namespace"]
	authSourceName := vars["name"]
	return authSourceNamespace + "." + authSourceName
}

func redirectResponse(w http.ResponseWriter, r *http.Request, redirectKey string, user *meta.User, site *meta.Site) {

	// If we had an old session, remove it.
	w.Header().Del("set-cookie")
	session := sess.Login(w, user, site)

	// Check for redirect parameter on the referrer
	referer, err := url.Parse(r.Referer())
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	redirectPath := referer.Query().Get("r")

	var redirectNamespace, redirectRoute string

	if redirectPath == "" {
		if redirectKey == "" {
			http.Error(w, "No redirect route specified", http.StatusInternalServerError)
			return
		}
		redirectNamespace, redirectRoute, err = meta.ParseKey(redirectKey)
		if err != nil {
			logger.LogError(err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	file.RespondJSON(w, r, &routing.LoginResponse{
		User: GetUserMergeData(session),
		// We'll want to read this from a setting somewhere
		RedirectRouteNamespace: redirectNamespace,
		RedirectRouteName:      redirectRoute,
		RedirectPath:           redirectPath,
	})
}

func Login(w http.ResponseWriter, r *http.Request) {

	var loginRequest map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&loginRequest)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.Log(msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	s := middleware.GetSession(r)
	site := s.GetSite()

	user, err := auth.Login(getAuthSourceID(mux.Vars(r)), loginRequest, s)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	profile, err := auth.LoadAndHydrateProfile(user.Profile, s)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		//return nil, errors.New("Error Loading Profile: " + user.Profile + " : " + err.Error())
	}

	redirectRoute := site.GetAppBundle().HomeRoute

	if profile.RedirectRoute != "" {
		redirectRoute = profile.RedirectRoute
	}

	redirectResponse(w, r, redirectRoute, user, site)

}

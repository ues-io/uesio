package controller

import (
	"encoding/json"
	"net/http"
	"net/url"

	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/auth"
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

func loginRedirectResponse(w http.ResponseWriter, r *http.Request, user *meta.User, session *sess.Session) {

	site := session.GetSite()

	profile, err := datasource.LoadAndHydrateProfile(user.Profile, session)
	if err != nil {
		HandleError(w, err)
		return
	}

	redirectKey := site.GetAppBundle().HomeRoute

	if profile.HomeRoute != "" {
		redirectKey = profile.HomeRoute
	}
	// If we had an old session, remove it.
	w.Header().Del("set-cookie")
	session = sess.Login(w, user, site)

	// Check for redirect parameter on the referrer
	referer, err := url.Parse(r.Referer())
	if err != nil {
		HandleError(w, err)
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
			HandleError(w, err)
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
		HandleError(w, exceptions.NewBadRequestException("invalid login request body"))
		return
	}

	s := middleware.GetSession(r)

	user, err := auth.Login(getAuthSourceID(mux.Vars(r)), loginRequest, s)
	if err != nil {
		HandleError(w, err)
		return
	}

	loginRedirectResponse(w, r, user, s)

}

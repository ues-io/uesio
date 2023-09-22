package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/file"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/routing"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func Logout(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	site := session.GetSite()
	publicUser, err := auth.GetPublicUser(site, nil)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	session = sess.Logout(w, r, publicUser, session)

	loginRoute := site.GetAppBundle().LoginRoute
	if loginRoute == "" {
		http.Error(w, "No Home Route Specfied", http.StatusInternalServerError)
		return
	}
	redirectNamespace, redirectRoute, err := meta.ParseKey(loginRoute)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	file.RespondJSON(w, r, &routing.LoginResponse{
		User: GetUserMergeData(session),
		// We'll want to read this from a setting somewhere
		RedirectRouteNamespace: redirectNamespace,
		RedirectRouteName:      redirectRoute,
	})
}

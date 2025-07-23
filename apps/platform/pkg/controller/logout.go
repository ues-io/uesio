package controller

import (
	"net/http"
	"net/url"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/preload"
	"github.com/thecloudmasters/uesio/pkg/routing"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func Logout(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	site := session.GetSite()
	publicUser, err := auth.GetPublicUser(site, nil)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	err = auth.HydrateUserPermissions(publicUser, session)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	session = sess.Logout(w, r, publicUser, session)

	route, err := routing.GetLoginRoute(session)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	redirectPath, err := url.JoinPath("/", route.Path)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	filejson.RespondJSON(w, r, auth.NewLoginResponse(preload.GetUserMergeData(session), "", redirectPath))
}

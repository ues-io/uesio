package controller

import (
	"fmt"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/preload"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func Logout(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	site := session.GetSite()
	publicUser, err := auth.GetPublicUser(site, nil)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	session = sess.Logout(w, r, publicUser, session)

	loginRoute := site.GetAppBundle().LoginRoute
	if loginRoute == "" {
		http.Error(w, "No Home Route defined", http.StatusInternalServerError)
		return
	}
	redirectNamespace, redirectRoute, err := meta.ParseKey(loginRoute)
	if err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException(fmt.Sprintf("invalid login route: %s", loginRoute), nil))
		return
	}

	filejson.RespondJSON(w, r, &preload.LoginResponse{
		User: preload.GetUserMergeData(session),
		// We'll want to read this from a setting somewhere
		RedirectRouteNamespace: redirectNamespace,
		RedirectRouteName:      redirectRoute,
	})
}

package controller

import (
	"errors"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/preload"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func Logout(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	site := session.GetSite()
	session, err := auth.HandleLogoutSuccess(r.Context(), site)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	loginRoute := site.GetAppBundle().LoginRoute
	if loginRoute == "" {
		ctlutil.HandleError(r.Context(), w, errors.New("no Login route defined"))
		return
	}
	redirectNamespace, redirectRoute, err := meta.ParseKey(loginRoute)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid login route: "+loginRoute, nil))
		return
	}

	filejson.RespondJSON(w, r, auth.NewLoginResponse(preload.GetUserMergeData(session), "", "", redirectNamespace, redirectRoute))
}

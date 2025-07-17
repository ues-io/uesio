package controller

import (
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func getAuthSourceID(vars map[string]string) string {
	authSourceNamespace := vars["namespace"]
	authSourceName := vars["name"]
	return authSourceNamespace + "." + authSourceName
}

func Login(w http.ResponseWriter, r *http.Request) {

	s := middleware.GetSession(r)

	auth.Login(w, r, getAuthSourceID(mux.Vars(r)), s)

}

func RequestLogin(w http.ResponseWriter, r *http.Request) {

	s := middleware.GetSession(r)

	auth.RequestLogin(w, r, getAuthSourceID(mux.Vars(r)), s)

}

func CLIAuthorize(w http.ResponseWriter, r *http.Request) {
	s := middleware.GetSession(r)
	// IsPublicUser is the most reliable way we have currently for the equivalent of IsAuthenticated check. See comments there for more details
	if s.IsPublicUser() {
		if auth.RedirectToLoginRoute(w, r, s, auth.NotFound) {
			return
		}
	}
	// We only support CLI for studio currently
	if s.GetSite().GetAppFullName() != "uesio/studio" {
		ctlutil.HandleError(r.Context(), w, exceptions.NewForbiddenException("CLI login is only supported for the uesio/studio app"))
		return
	}
	auth.CLIAuthorize(w, r, s)
}

func CLIToken(w http.ResponseWriter, r *http.Request) {
	s := middleware.GetSession(r)
	// We only support CLI for studio currently
	if s.GetSite().GetAppFullName() != "uesio/studio" {
		ctlutil.HandleError(r.Context(), w, exceptions.NewForbiddenException("CLI login is only supported for the uesio/studio app"))
		return
	}
	auth.CLIToken(w, r, s)
}

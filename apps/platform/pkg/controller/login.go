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
	// See comments in ensurePublicSession for why we do this.
	s, err := ensurePublicSession(w, r)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	auth.Login(w, r, getAuthSourceID(mux.Vars(r)), s)
}

func LoginWorkspace(w http.ResponseWriter, r *http.Request) {
	// NOTE - When this route was originally added (see https://github.com/ues-io/uesio/pull/3173/files#diff-32534e43cb95bca7a16bd38e55836771f681dc0c5a86be6672db6bcbd7745788R330),
	// according to @humandad, the thinking was to provide a way for users to preview their signup/login/etc. pages within a workspace and perform the operation
	// without impacting their current logged in session. The implementation was only completed, however, in samlauth and that was only for a prototype scenario. As it stands,
	// the appkit login that is used always navigates to /site/auth/<loginmethod> routes so other than direct API usage, there is no way to get to a workspace
	// login route currently and even when you call API, only samlauth provider will process it (others will return error). Most importantly, by using a "Login" process
	// for this, the current user session would be replaced with the new signed in user and the previously logged in user session removed rendering it somewhat limited
	// in its benefit. All is to say that this route should likely utilize the "impersonation" concept so that the current user stays logged in or simply "no-op" the login,
	// signup, etc. activities when in a workspace context, although that would limit the benefit of having them be "usable" in a workspace context. For now, leaving
	// the functionality as it was prior to the introducing the "ensurePublicSession" concept for standard login operations.
	s := middleware.GetSession(r)
	auth.Login(w, r, getAuthSourceID(mux.Vars(r)), s)
}

func RequestLogin(w http.ResponseWriter, r *http.Request) {
	// See comments in ensurePublicSession for why we do this.
	s, err := ensurePublicSession(w, r)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	auth.RequestLogin(w, r, getAuthSourceID(mux.Vars(r)), s)
}

func RequestLoginWorkspace(w http.ResponseWriter, r *http.Request) {
	// NOTE - See details in comment in LoginWorkspace function. This route was added in https://github.com/ues-io/uesio/pull/3892/files#diff-32534e43cb95bca7a16bd38e55836771f681dc0c5a86be6672db6bcbd7745788)
	// but takes the same form/purpose as the LoginWorkspace route.
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

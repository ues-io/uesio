package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Logout is good
func Logout(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	session = sess.Logout(w, session)

	respondJSON(w, r, &LoginResponse{
		User: GetUserMergeData(session),
		// We'll want to read this from a setting somewhere
		RedirectRouteNamespace: "uesio",
		RedirectRouteName:      "login",
	})
}

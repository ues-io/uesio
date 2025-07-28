package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/preload"
)

func AuthCheck(w http.ResponseWriter, r *http.Request) {
	// TODO: Do we need full user data here? If only intended to be "am I logged in or not", possibly
	// this should just be a simple "IsAuthenticated" check maybe with some basic user info?
	filejson.RespondJSON(w, r, NewUserResponse(preload.GetUserMergeData(middleware.GetSession(r))))
}

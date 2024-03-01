package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/preload"
)

func AuthCheck(w http.ResponseWriter, r *http.Request) {
	filejson.RespondJSON(w, r, &preload.LoginResponse{
		User: preload.GetUserMergeData(middleware.GetSession(r)),
	})
}

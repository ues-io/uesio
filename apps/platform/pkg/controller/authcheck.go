package controller

import (
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/routing"
)

func AuthCheck(w http.ResponseWriter, r *http.Request) {
	file.RespondJSON(w, r, &routing.LoginResponse{
		User: GetUserMergeData(middleware.GetSession(r)),
	})
}

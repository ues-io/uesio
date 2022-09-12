package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/routing"
)

func AuthCheck(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, r, &routing.LoginResponse{
		User: GetUserMergeData(middleware.GetSession(r)),
	})
}

package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/middleware"
)

// AuthCheck is good
func AuthCheck(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, r, &LoginResponse{
		User: GetUserMergeData(middleware.GetSession(r)),
	})
}

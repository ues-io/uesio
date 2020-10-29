package controllers

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/middlewares"
)

// AuthCheck is good
func AuthCheck(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, r, &LoginResponse{
		User: GetUserMergeData(middlewares.GetSession(r)),
	})
}

package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
)

// AuthCheck is good
func AuthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "text/json")

	sess := r.Context().Value(middlewares.SessionKey).(*session.Session)

	loginResponse := &LoginResponse{
		User: GetUserMergeData(sess),
	}

	err := json.NewEncoder(w).Encode(loginResponse)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

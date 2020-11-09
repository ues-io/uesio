package controllers

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
)

// BotResponse struct
type BotResponse struct {
	Success bool
}

// CallBot is good
func CallBot(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]

	session := middlewares.GetSession(r)

	err := datasource.CallBot(namespace, name, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, r, &ViewSaveResponse{
		Success: true,
	})
}

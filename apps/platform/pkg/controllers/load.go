package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
)

// Load is good
func Load(w http.ResponseWriter, r *http.Request) {

	// 1. Parse the request object.
	decoder := json.NewDecoder(r.Body)
	var loadRequestBatch datasource.LoadRequestBatch
	err := decoder.Decode(&loadRequestBatch)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	session := middlewares.GetSession(r)

	response, err := datasource.Load(loadRequestBatch, session)
	if err != nil {
		msg := "Load Failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	respondJSON(w, r, response)
}

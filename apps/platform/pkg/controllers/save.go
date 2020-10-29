package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
)

// Save is good - so good
func Save(w http.ResponseWriter, r *http.Request) {

	// 1. Parse the request object.
	decoder := json.NewDecoder(r.Body)
	var saveRequestBatch datasource.SaveRequestBatch
	err := decoder.Decode(&saveRequestBatch)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.Log(msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	session := middlewares.GetSession(r)

	response, err := datasource.Save(saveRequestBatch, session)
	if err != nil {
		msg := "Save Failed: " + err.Error()
		logger.Log(msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	respondJSON(w, r, response)

}

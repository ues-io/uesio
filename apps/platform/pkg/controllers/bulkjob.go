package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/bulk"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
)

// JobResponse struct
type JobResponse struct {
	ID string `json:"id"`
}

// BulkJob is good
func BulkJob(w http.ResponseWriter, r *http.Request) {
	// 1. Parse the request object.
	decoder := json.NewDecoder(r.Body)
	var spec metadata.JobSpec
	err := decoder.Decode(&spec)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	session := middlewares.GetSession(r)

	jobID, err := bulk.NewJob(&spec, session)
	if err != nil {
		msg := "Failed Creating New Job: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	respondJSON(w, r, &JobResponse{
		ID: jobID,
	})

}

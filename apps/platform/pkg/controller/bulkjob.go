package controller

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/bulk"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func BulkJob(w http.ResponseWriter, r *http.Request) {
	// 1. Parse the request object.
	var spec meta.JobSpec
	err := json.NewDecoder(r.Body).Decode(&spec)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	session := middleware.GetSession(r)

	jobID, err := bulk.NewJob(&spec, session)
	if err != nil {
		msg := "Failed Creating New Job: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	respondJSON(w, r, &bulk.JobResponse{
		ID: jobID,
	})

}

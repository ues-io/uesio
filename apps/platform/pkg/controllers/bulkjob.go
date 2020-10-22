package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/icza/session"
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

	site := r.Context().Value(middlewares.SiteKey).(*metadata.Site)
	sess := r.Context().Value(middlewares.SessionKey).(*session.Session)

	jobID, err := bulk.NewJob(&spec, site, sess)
	if err != nil {
		msg := "Failed Creating New Job: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	jobResponse := &JobResponse{
		ID: jobID,
	}

	err = json.NewEncoder(w).Encode(jobResponse)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

}

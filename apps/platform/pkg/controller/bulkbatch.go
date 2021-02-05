package controller

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bulk"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

// BatchResponse struct
type BatchResponse struct {
	ID string `json:"id"`
}

// BulkBatch is good
func BulkBatch(w http.ResponseWriter, r *http.Request) {

	vars := mux.Vars(r)
	jobID := vars["job"]

	session := middleware.GetSession(r)

	batch, err := bulk.NewBatch(r.Body, jobID, session)
	if err != nil {
		msg := "Failed Creating New Batch: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	respondJSON(w, r, &BatchResponse{
		ID: batch.ID,
	})

}

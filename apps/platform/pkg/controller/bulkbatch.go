package controller

import (
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bulk"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

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

	file.RespondJSON(w, r, &bulk.BatchResponse{
		ID: batch.ID,
	})

}

package controller

import (
	"log/slog"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/file"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bulk"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func BulkBatch(w http.ResponseWriter, r *http.Request) {

	vars := mux.Vars(r)
	jobID := vars["job"]

	session := middleware.GetSession(r)

	batch, err := bulk.NewBatch(r.Body, jobID, session)
	if err != nil {
		msg := "Failed Creating New Batch: " + err.Error()
		slog.Error(msg)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	file.RespondJSON(w, r, &bulk.BatchResponse{
		ID: batch.ID,
	})

}

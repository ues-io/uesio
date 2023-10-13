package controller

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/file"

	"github.com/thecloudmasters/uesio/pkg/bulk"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func BulkJob(w http.ResponseWriter, r *http.Request) {
	// 1. Parse the request object.
	var specreq meta.JobSpecRequest
	err := json.NewDecoder(r.Body).Decode(&specreq)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		slog.Error(msg)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	session := middleware.GetSession(r)

	spec := meta.JobSpec(specreq)
	jobID, err := bulk.NewJob(&spec, session)
	if err != nil {
		msg := "Failed Creating New Job: " + err.Error()
		slog.Error(msg)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	file.RespondJSON(w, r, &bulk.JobResponse{
		ID: jobID,
	})

}

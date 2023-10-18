package controller

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/file"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Save(w http.ResponseWriter, r *http.Request) {

	// 1. Parse the request object.
	var saveRequestBatch datasource.SaveRequestBatch
	err := json.NewDecoder(r.Body).Decode(&saveRequestBatch)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		slog.Error(msg)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	session := middleware.GetSession(r)

	err = datasource.Save(saveRequestBatch.Wires, session)
	if err != nil {
		_, ok := err.(*adapt.SaveError)
		if ok {
			file.RespondJSON(w, r, &saveRequestBatch)
			return
		}
		// If the error is a save error still respond
		msg := "Save Failed: " + err.Error()
		slog.Error(msg)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}
	file.RespondJSON(w, r, &saveRequestBatch)
}

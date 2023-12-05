package controller

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/types/wire"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Load(w http.ResponseWriter, r *http.Request) {

	var batch wire.LoadRequestBatch
	err := json.NewDecoder(r.Body).Decode(&batch)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		slog.Error(msg)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	session := middleware.GetSession(r)

	metadata, err := datasource.Load(batch.Wires, session, nil)
	if err != nil {
		msg := "Load Failed: " + err.Error()
		slog.Error(msg)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}
	loadResponse := &wire.LoadResponseBatch{
		Wires: batch.Wires,
	}
	// Only include metadata if explicitly requested
	if batch.IncludeMetadata == true {
		loadResponse.Collections = metadata.Collections
	}
	file.RespondJSON(w, r, loadResponse.TrimStructForSerialization())
}

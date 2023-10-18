package controller

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/file"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Load(w http.ResponseWriter, r *http.Request) {

	var batch adapt.LoadRequestBatch

	buf := new(bytes.Buffer)
	buf.ReadFrom(r.Body)
	raw := buf.String()
	fmt.Println("** raw: ")
	fmt.Printf("%v", raw)

	err := json.NewDecoder(buf).Decode(&batch)
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
	loadResponse := &adapt.LoadResponseBatch{
		Wires: batch.Wires,
	}
	// Only include metadata if explicitly requested
	if batch.IncludeMetadata == true {
		loadResponse.Collections = metadata.Collections
	}
	file.RespondJSON(w, r, loadResponse.TrimStructForSerialization())
}

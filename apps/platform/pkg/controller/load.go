package controller

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/types/wire"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Load(w http.ResponseWriter, r *http.Request) {

	var batch wire.LoadRequestBatch
	if err := json.NewDecoder(r.Body).Decode(&batch); err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	session := middleware.GetSession(r)

	metadata, err := datasource.Load(batch.Wires, session, nil)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	loadResponse := &wire.LoadResponseBatch{
		Wires: batch.Wires,
	}
	// Only include metadata if explicitly requested
	if batch.IncludeMetadata == true {
		loadResponse.Collections = metadata.Collections
		loadResponse.SelectLists = metadata.GetSelectLists()
	}
	file.RespondJSON(w, r, loadResponse.TrimStructForSerialization())
}

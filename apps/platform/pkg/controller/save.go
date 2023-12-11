package controller

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Save(w http.ResponseWriter, r *http.Request) {

	// 1. Parse the request object.
	var saveRequestBatch datasource.SaveRequestBatch
	if err := json.NewDecoder(r.Body).Decode(&saveRequestBatch); err != nil {
		HandleError(w, exceptions.NewBadRequestException("invalid save request: "+err.Error()))
		return
	}

	session := middleware.GetSession(r)

	if err := datasource.Save(saveRequestBatch.Wires, session); err != nil {
		_, ok := err.(*wire.SaveError)
		// If the error is a save error still respond
		if ok {
			file.RespondJSON(w, r, &saveRequestBatch)
			return
		}
		HandleError(w, err)
		return
	}
	file.RespondJSON(w, r, &saveRequestBatch)
}

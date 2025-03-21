package controller

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func Save(w http.ResponseWriter, r *http.Request) {

	// 1. Parse the request object.
	var saveRequestBatch datasource.SaveRequestBatch
	if err := json.NewDecoder(r.Body).Decode(&saveRequestBatch); err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("invalid save request: "+err.Error()))
		return
	}

	session := middleware.GetSession(r)

	if err := datasource.Save(saveRequestBatch.Wires, session); err != nil {
		// If the error is a save error still respond
		if exceptions.IsType[*exceptions.SaveException](err) {
			filejson.RespondJSON(w, r, &saveRequestBatch)
			return
		}
		ctlutil.HandleError(w, err)
		return
	}
	filejson.RespondJSON(w, r, &saveRequestBatch)
}

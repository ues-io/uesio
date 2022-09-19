package controller

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

type SaveRequestBatch struct {
	Wires []datasource.SaveRequest `json:"wires"`
}

func Save(w http.ResponseWriter, r *http.Request) {

	// 1. Parse the request object.
	var saveRequestBatch SaveRequestBatch
	err := json.NewDecoder(r.Body).Decode(&saveRequestBatch)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.Log(msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	session := middleware.GetSession(r)

	err = datasource.Save(saveRequestBatch.Wires, session)
	if err != nil {
		_, ok := err.(*adapt.SaveError)
		if ok {
			respondJSON(w, r, &saveRequestBatch)
			return
		}
		// If the error is a save error still respond
		msg := "Save Failed: " + err.Error()
		logger.Log(msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}
	respondJSON(w, r, &saveRequestBatch)
}

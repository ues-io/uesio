package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/loadresponse"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
)

// Load is good
func Load(w http.ResponseWriter, r *http.Request) {

	// 1. Parse the request object.
	var loadRequestBatch datasource.LoadRequestBatch
	err := json.NewDecoder(r.Body).Decode(&loadRequestBatch)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	session := middlewares.GetSession(r)

	ops := make([]adapters.LoadOp, len(loadRequestBatch.Wires))

	for i := range loadRequestBatch.Wires {
		wire := loadRequestBatch.Wires[i]
		ops[i] = adapters.LoadOp{
			WireName:       wire.Wire,
			CollectionName: wire.Collection,
			Collection:     &loadresponse.Collection{},
			Conditions:     wire.Conditions,
			Fields:         wire.Fields,
		}
	}

	metadata, err := datasource.Load(ops, session)
	if err != nil {
		msg := "Load Failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	respondJSON(w, r, &datasource.LoadResponseBatch{
		Wires:       ops,
		Collections: metadata.Collections,
	})
}

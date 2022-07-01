package controller

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

// LoadRequest struct
type LoadRequest struct {
	Collection         string                       `json:"collection"`
	Wire               string                       `json:"wire"`
	Query              bool                         `json:"query"`
	Fields             []adapt.LoadRequestField     `json:"fields"`
	Conditions         []adapt.LoadRequestCondition `json:"conditions"`
	Order              []adapt.LoadRequestOrder     `json:"order"`
	BatchSize          int                          `json:"batchsize"`
	BatchNumber        int                          `json:"batchnumber"`
	RequireWriteAccess bool                         `json:"requirewriteaccess"`
}

// LoadRequestBatch struct
type LoadRequestBatch struct {
	Wires []LoadRequest `json:"wires"`
}

// LoadResponseBatch struct
type LoadResponseBatch struct {
	Wires       []*adapt.LoadOp                      `json:"wires"`
	Collections map[string]*adapt.CollectionMetadata `json:"collections"`
}

// Load is good
func Load(w http.ResponseWriter, r *http.Request) {

	// 1. Parse the request object.
	var loadRequestBatch LoadRequestBatch
	err := json.NewDecoder(r.Body).Decode(&loadRequestBatch)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	session := middleware.GetSession(r)

	ops := make([]*adapt.LoadOp, len(loadRequestBatch.Wires))

	for i := range loadRequestBatch.Wires {
		wire := loadRequestBatch.Wires[i]
		ops[i] = &adapt.LoadOp{
			WireName:           wire.Wire,
			CollectionName:     wire.Collection,
			Collection:         &adapt.Collection{},
			Conditions:         wire.Conditions,
			Fields:             wire.Fields,
			Order:              wire.Order,
			Query:              wire.Query,
			BatchSize:          wire.BatchSize,
			BatchNumber:        wire.BatchNumber,
			RequireWriteAccess: wire.RequireWriteAccess,
		}
	}

	metadata, err := datasource.Load(ops, session, nil)
	if err != nil {
		msg := "Load Failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	respondJSON(w, r, &LoadResponseBatch{
		Wires:       ops,
		Collections: metadata.Collections,
	})
}

package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
)

// Save is good - so good
func Save(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "text/json")

	// 1. Parse the request object.
	decoder := json.NewDecoder(r.Body)
	var saveRequestBatch datasource.SaveRequestBatch
	err := decoder.Decode(&saveRequestBatch)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.Log(msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	site := r.Context().Value(middlewares.SiteKey).(*metadata.Site)
	sess := r.Context().Value(middlewares.SessionKey).(*session.Session)

	response, err := datasource.Save(saveRequestBatch, site, sess)
	if err != nil {
		msg := "Save Failed: " + err.Error()
		logger.Log(msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	outData, err := json.Marshal(response)
	if err != nil {
		msg := "Invalid response format: " + err.Error()
		logger.Log(msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	w.Write(outData)
}

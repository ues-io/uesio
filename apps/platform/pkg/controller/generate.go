package controller

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
)

func Generate(w http.ResponseWriter, r *http.Request) {

	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]

	var params map[string]string
	err := json.NewDecoder(r.Body).Decode(&params)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	session := middleware.GetSession(r)

	files, err := datasource.CallGeneratorBot(namespace, name, params, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		respondJSON(w, r, &BotResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	err = retrieve.Zip(w, files, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

}

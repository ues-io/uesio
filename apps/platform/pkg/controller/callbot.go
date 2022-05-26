package controller

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

type BotResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
}

func CallListenerBot(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]

	var params map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&params)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	session := middleware.GetSession(r)

	err = datasource.CallListenerBot(namespace, name, params, nil, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		respondJSON(w, r, &BotResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	respondJSON(w, r, &BotResponse{
		Success: true,
	})
}

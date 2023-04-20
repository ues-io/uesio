package controller

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/bot"
	"github.com/thecloudmasters/uesio/pkg/controller/file"

	"github.com/francoispqt/gojay"
	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/featureflagstore"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func FeatureFlag(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	vars := mux.Vars(r)
	user := vars["user"]

	response, err := featureflagstore.GetFeatureFlags(session, user)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	bytes, err := gojay.MarshalJSONArray(response)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	file.RespondJSON(w, r, json.RawMessage(bytes))
}

type FeatureFlagSetRequest struct {
	Value bool   `json:"value"`
	User  string `json:"user"`
}

func SetFeatureFlag(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]
	var setRequest FeatureFlagSetRequest
	err := json.NewDecoder(r.Body).Decode(&setRequest)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.Log(msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}
	err = featureflagstore.SetValueFromKey(namespace+"."+name, setRequest.Value, setRequest.User, session)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	file.RespondJSON(w, r, &bot.BotResponse{
		Success: true,
	})
}

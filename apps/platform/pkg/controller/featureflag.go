package controller

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/featureflagstore"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type FeatureFlagResponse struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Value     bool   `json:"value"`
	User      string `json:"user"`
}

func getFeatureFlags(session *sess.Session, user string) ([]FeatureFlagResponse, error) {
	var featureFlags meta.FeatureFlagCollection
	err := bundle.LoadAllFromAny(&featureFlags, nil, session)
	if err != nil {
		return nil, err
	}

	response := []FeatureFlagResponse{}

	for _, cv := range featureFlags {
		ffa, err := featureflagstore.GetValue(cv, user, session)
		if err != nil {
			response = append(response, FeatureFlagResponse{
				Name:      cv.Name,
				Namespace: cv.Namespace,
				User:      "",
				Value:     false,
			})
			continue
		}
		response = append(response, FeatureFlagResponse{
			Name:      cv.Name,
			Namespace: cv.Namespace,
			User:      ffa.User,
			Value:     ffa.Value,
		})
	}
	return response, nil
}

func FeatureFlag(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	vars := mux.Vars(r)
	user := vars["user"]

	response, err := getFeatureFlags(session, user)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, r, response)
}

type FeatureFlagSetRequest struct {
	Value bool   `json:"value"`
	User  string `json:"user"`
}

func SetFeatureFlag(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	vars := mux.Vars(r)
	key := vars["key"]
	var setRequest FeatureFlagSetRequest
	err := json.NewDecoder(r.Body).Decode(&setRequest)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}
	err = featureflagstore.SetValueFromKey(key, setRequest.Value, setRequest.User, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, r, &BotResponse{
		Success: true,
	})
}

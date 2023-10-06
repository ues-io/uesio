package controller

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/bot"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/datasource"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type SecretResponse struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	ManagedBy string `json:"managedby"`
}

func getSecrets(session *sess.Session) ([]SecretResponse, error) {
	var secrets meta.SecretCollection
	err := bundle.LoadAllFromAny(&secrets, nil, session, nil)
	if err != nil {
		return nil, err
	}

	response := []SecretResponse{}

	for _, s := range secrets {
		if s.ManagedBy == "app" || s.Store == "environment" {
			continue
		}
		response = append(response, SecretResponse{
			Name:      s.Name,
			Namespace: s.Namespace,
			ManagedBy: s.ManagedBy,
		})
	}
	return response, nil
}

func Secrets(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)

	response, err := getSecrets(session)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	file.RespondJSON(w, r, response)
}

type SecretSetRequest struct {
	Value string `json:"value"`
}

func SetSecret(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]
	var setRequest SecretSetRequest
	err := json.NewDecoder(r.Body).Decode(&setRequest)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.Log(msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}
	err = datasource.SetSecretFromKey(namespace+"."+name, setRequest.Value, session)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	file.RespondJSON(w, r, &bot.BotResponse{
		Success: true,
	})
}

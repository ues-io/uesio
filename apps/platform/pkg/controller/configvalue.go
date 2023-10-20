package controller

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/bot"
	"github.com/thecloudmasters/uesio/pkg/controller/file"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type ConfigValueResponse struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Value     string `json:"value"`
	ManagedBy string `json:"managedby"`
}

func getValue(session *sess.Session, key string) (*ConfigValueResponse, error) {
	configValue, err := meta.NewConfigValue(key)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(configValue, session, nil)
	if err != nil {
		return nil, err
	}

	value, err := configstore.GetValueFromKey(key, session)
	if err != nil {
		return nil, err
	}
	return &ConfigValueResponse{
		Name:      configValue.Name,
		Namespace: configValue.Namespace,
		ManagedBy: configValue.ManagedBy,
		Value:     value,
	}, nil

}

func getValues(session *sess.Session) ([]ConfigValueResponse, error) {
	var configValues meta.ConfigValueCollection
	err := bundle.LoadAllFromAny(&configValues, nil, session, nil)
	if err != nil {
		return nil, err
	}

	response := []ConfigValueResponse{}

	for _, cv := range configValues {
		if cv.ManagedBy == "app" || cv.Store == "environment" {
			continue
		}
		value, err := configstore.GetValue(cv, session)
		if err != nil {
			return nil, err
		}
		response = append(response, ConfigValueResponse{
			Name:      cv.Name,
			Namespace: cv.Namespace,
			ManagedBy: cv.ManagedBy,
			Value:     value,
		})
	}
	return response, nil
}

func ConfigValues(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)

	response, err := getValues(session)
	if err != nil {
		slog.Error(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	file.RespondJSON(w, r, response)
}

func ConfigValue(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	vars := mux.Vars(r)
	key := vars["key"]

	response, err := getValue(session, key)
	if err != nil {
		slog.Error(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	file.RespondJSON(w, r, response)
}

type ConfigValueSetRequest struct {
	Value string `json:"value"`
}

func SetConfigValue(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]
	var setRequest ConfigValueSetRequest
	err := json.NewDecoder(r.Body).Decode(&setRequest)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		slog.Error(msg)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}
	err = configstore.SetValueFromKey(namespace+"."+name, setRequest.Value, session)
	if err != nil {
		slog.Error(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	file.RespondJSON(w, r, &bot.BotResponse{
		Success: true,
	})
}

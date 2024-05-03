package controller

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/bot"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

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
	err = bundle.Load(configValue, nil, session, nil)
	if err != nil {
		return nil, err
	}

	value, err := configstore.GetValue(configValue, session)
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

	configValues, err := configstore.GetConfigValues(session, &configstore.ConfigLoadOptions{
		OnlyWriteable: true,
	})
	if err != nil {
		return nil, err
	}

	var response []ConfigValueResponse

	for _, cv := range *configValues {
		response = append(response, ConfigValueResponse{
			Name:      cv.Name,
			Namespace: cv.Namespace,
			ManagedBy: cv.ManagedBy,
			Value:     cv.Value,
		})
	}
	return response, nil
}

func ConfigValues(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)

	response, err := getValues(session)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	filejson.RespondJSON(w, r, response)
}

func ConfigValue(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	vars := mux.Vars(r)
	key := vars["key"]

	response, err := getValue(session, key)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	filejson.RespondJSON(w, r, response)
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
		ctlutil.HandleError(w, exceptions.NewBadRequestException("invalid request format"))
		return
	}
	if err = configstore.SetValueFromKey(namespace+"."+name, setRequest.Value, session); err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	filejson.RespondJSON(w, r, &bot.BotResponse{
		Success: true,
	})
}

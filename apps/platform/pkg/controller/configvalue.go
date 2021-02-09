package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/logger"
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

func getValues(session *sess.Session) ([]ConfigValueResponse, error) {
	var configValues meta.ConfigValueCollection
	err := bundle.LoadAllFromAny(&configValues, nil, session)
	if err != nil {
		return nil, err
	}

	response := []ConfigValueResponse{}

	for _, cv := range configValues {
		value, err := configstore.GetValue(cv.Namespace, cv.Name, session.GetSite())
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

//ConfigValue function
func ConfigValue(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)

	response, err := getValues(session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, r, response)
}

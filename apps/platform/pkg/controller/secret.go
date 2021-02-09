package controller

import (
	"net/http"

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
	err := bundle.LoadAllFromAny(&secrets, nil, session)
	if err != nil {
		return nil, err
	}

	response := []SecretResponse{}

	for _, s := range secrets {
		response = append(response, SecretResponse{
			Name:      s.Name,
			Namespace: s.Namespace,
			ManagedBy: s.ManagedBy,
		})
	}
	return response, nil
}

//Secret function
func Secret(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)

	response, err := getSecrets(session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, r, response)
}

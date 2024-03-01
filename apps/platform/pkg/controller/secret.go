package controller

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/bot"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundle"
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
	if err := bundle.LoadAllFromAny(&secrets, nil, session, nil); err != nil {
		return nil, err
	}

	var response []SecretResponse

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
		ctlutil.HandleError(w, err)
		return
	}

	filejson.RespondJSON(w, r, response)
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
	if err := json.NewDecoder(r.Body).Decode(&setRequest); err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("invalid request body"))
		return
	}
	if err := datasource.SetSecretFromKey(namespace+"."+name, setRequest.Value, session); err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	filejson.RespondJSON(w, r, &bot.BotResponse{
		Success: true,
	})
}

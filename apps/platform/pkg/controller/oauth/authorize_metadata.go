package oauth

import (
	"fmt"
	"log/slog"
	"net/http"

	"github.com/gorilla/mux"
	oauthLib "golang.org/x/oauth2"

	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	oauth "github.com/thecloudmasters/uesio/pkg/oauth2"
)

type RedirectMetadata struct {
	AuthURL string `json:"authUrl"`
	State   string `json:"state"`
}

func GetRedirectMetadata(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	integrationName := fmt.Sprintf("%s.%s", vars["namespace"], vars["name"])
	session := middleware.GetSession(r)
	integrationConnection, err := datasource.GetIntegrationConnection(integrationName, session, nil)
	if err != nil {
		http.Error(w, "Invalid integration: "+err.Error(), http.StatusBadRequest)
		return
	}
	conf, err := oauth.GetConfig(integrationConnection.GetCredentials(), fmt.Sprintf("https://%s", r.Host))
	if err != nil {
		http.Error(w, "Invalid integration configuration: "+err.Error(), http.StatusForbidden)
		return
	}

	// Generate a state token, with workspace/site admin context as necessary, and serialize it
	stateObject := oauth.NewState(integrationName).WithContext(session)
	stateString, err := stateObject.Marshal()
	if err != nil {
		slog.Error("unable to generate an OAuth state token: " + err.Error())
		http.Error(w, "unable to generate a state token", http.StatusInternalServerError)
		return
	}

	// Generate the fully-qualified authorization code URL
	url := conf.AuthCodeURL(stateString, oauthLib.AccessTypeOffline)

	file.RespondJSON(w, r, &RedirectMetadata{
		AuthURL: url,
		State:   stateString,
	})
}

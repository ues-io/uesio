package controller

import (
	"fmt"
	"log/slog"
	"net/http"

	"github.com/gorilla/mux"
	"golang.org/x/oauth2"

	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	oauth "github.com/thecloudmasters/uesio/pkg/oauth2"
)

type OAuth2RedirectMetadata struct {
	AuthURL string `json:"authUrl"`
	State   string `json:"state"`
}

func GetOAuth2RedirectMetadata(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	integrationName := fmt.Sprintf("%s/%s", vars["namespace"], vars["name"])
	session := middleware.GetSession(r)
	integrationConnection, err := datasource.GetIntegration(integrationName, session)
	if err != nil {
		http.Error(w, "invalid integration name", http.StatusBadRequest)
		return
	}

	conf, err := oauth.GetConfig(integrationConnection.GetCredentials())
	if err != nil {
		http.Error(w, "unable to obtain credentials for this integration", http.StatusForbidden)
		return
	}
	// Need to provide the domain to the Authorization Code URL
	domain := fmt.Sprintf("%s://%s", r.URL.Scheme, r.URL.Hostname())
	if r.URL.Port() != "" {
		domain = domain + ":" + r.URL.Port()
	}
	conf.RedirectURL = fmt.Sprintf("%s%s", domain, conf.RedirectURL)

	// Generate a state token
	stateObject := oauth.NewState(integrationName)
	stateString, err := stateObject.Marshal()
	if err != nil {
		slog.Error("unable to generate an OAuth state token: " + err.Error())
		http.Error(w, "unable to generate a state token", http.StatusInternalServerError)
		return
	}

	// Generate the fully-qualified authorization code URL
	url := conf.AuthCodeURL(stateString, oauth2.AccessTypeOffline)

	file.RespondJSON(w, r, &OAuth2RedirectMetadata{
		AuthURL: url,
		State:   stateString,
	})
}

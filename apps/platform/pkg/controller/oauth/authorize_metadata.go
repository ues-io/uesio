package oauth

import (
	"fmt"
	"log/slog"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	oauth "github.com/thecloudmasters/uesio/pkg/oauth2"
)

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
	redirectMetadata, err := oauth.GetRedirectMetadata(conf, integrationName, session)
	if err != nil {
		slog.Error(err.Error())
		http.Error(w, "unable to generate a state token", http.StatusInternalServerError)
		return
	}
	file.RespondJSON(w, r, redirectMetadata)
}

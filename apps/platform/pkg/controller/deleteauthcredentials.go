package controller

import (
	"fmt"
	"log/slog"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/oauth2"

	"github.com/thecloudmasters/uesio/pkg/middleware"
)

// DeleteAuthCredentials deletes any per-user integration credentials for the context user
func DeleteAuthCredentials(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	user := session.GetContextUser()

	vars := mux.Vars(r)
	integrationName := fmt.Sprintf("%s.%s", vars["namespace"], vars["name"])

	conn, err := datasource.GetPlatformConnection(&adapt.MetadataCache{}, session, nil)
	if err != nil {
		slog.Error("unable to obtain platform connection: " + err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	coreSession, err := datasource.EnterVersionContext("uesio/core", session, conn)
	if err != nil {
		slog.Error("unable to obtain core session: " + err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	credential, err := oauth2.GetIntegrationCredential(user.ID, integrationName, coreSession, conn)

	if err != nil {
		slog.Error("unable to retrieve integration credential: " + err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if credential == nil {
		http.Error(w, "no integration credential found", http.StatusNotFound)
		return
	}

	// If we have a credential, delete it, otherwise, there's nothing to do
	if credential != nil {
		if err = oauth2.DeleteIntegrationCredential(credential, session, conn); err != nil {
			http.Error(w, "unable to delete integration credential", http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusNoContent)
}

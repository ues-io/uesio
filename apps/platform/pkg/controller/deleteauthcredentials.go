package controller

import (
	"fmt"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/oauth2"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

	"github.com/thecloudmasters/uesio/pkg/middleware"
)

// DeleteAuthCredentials deletes any per-user integration credentials for the context user
func DeleteAuthCredentials(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	user := session.GetContextUser()

	vars := mux.Vars(r)
	integrationName := fmt.Sprintf("%s.%s", vars["namespace"], vars["name"])

	conn, err := datasource.GetPlatformConnection(r.Context(), session, nil)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, fmt.Errorf("unable to obtain platform connection: %w", err))
		return
	}
	coreSession, err := datasource.EnterVersionContext(r.Context(), "uesio/core", session, conn)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, fmt.Errorf("unable to obtain core session: %w", err))
		return
	}

	credential, err := oauth2.GetIntegrationCredential(r.Context(), user.ID, integrationName, coreSession, conn)

	if err != nil {
		ctlutil.HandleError(r.Context(), w, fmt.Errorf("unable to retrieve integration credential for user: %w", err))
		return
	}

	if credential == nil {
		ctlutil.HandleError(r.Context(), w, exceptions.NewNotFoundException("no integration credential found"))
		return
	}

	// If we have a credential, delete it, otherwise, there's nothing to do
	if err = oauth2.DeleteIntegrationCredential(r.Context(), credential, coreSession, conn); err != nil {
		ctlutil.HandleError(r.Context(), w, fmt.Errorf("unable to delete integration credential: %w", err))
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

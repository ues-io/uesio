package controller

import (
	"errors"
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

	conn, err := datasource.GetPlatformConnection(session, nil)
	if err != nil {
		ctlutil.HandleError(w, errors.New("unable to obtain platform connection: "+err.Error()))
		return
	}
	coreSession, err := datasource.EnterVersionContext("uesio/core", session, conn)
	if err != nil {
		ctlutil.HandleError(w, errors.New("unable to obtain core session: "+err.Error()))
		return
	}

	credential, err := oauth2.GetIntegrationCredential(user.ID, integrationName, coreSession, conn)

	if err != nil {
		ctlutil.HandleError(w, errors.New("unable to retrieve integration credential for user: "+err.Error()))
		return
	}

	if credential == nil {
		ctlutil.HandleError(w, exceptions.NewNotFoundException("no integration credential found"))
		return
	}

	// If we have a credential, delete it, otherwise, there's nothing to do
	if err = oauth2.DeleteIntegrationCredential(credential, coreSession, conn); err != nil {
		ctlutil.HandleError(w, errors.New("unable to delete integration credential: "+err.Error()))
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

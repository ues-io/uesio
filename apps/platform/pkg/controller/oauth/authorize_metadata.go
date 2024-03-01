package oauth

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	oauth "github.com/thecloudmasters/uesio/pkg/oauth2"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func GetRedirectMetadata(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	integrationName := fmt.Sprintf("%s.%s", vars["namespace"], vars["name"])
	session := middleware.GetSession(r)
	integrationConnection, err := datasource.GetIntegrationConnection(integrationName, session, nil)
	if err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException(fmt.Sprintf(
			"invalid integration: %s", err.Error())))
		return
	}
	conf, err := oauth.GetConfig(integrationConnection.GetCredentials(), fmt.Sprintf("https://%s", r.Host))
	if err != nil {
		ctlutil.HandleError(w, exceptions.NewForbiddenException(fmt.Sprintf(
			"invalid integration configuration: %s", err.Error())))
		return
	}
	redirectMetadata, err := oauth.GetRedirectMetadata(conf, integrationName, session)
	if err != nil {
		ctlutil.HandleError(w, errors.New("unable to generate a state token"))
		return
	}
	filejson.RespondJSON(w, r, redirectMetadata)
}

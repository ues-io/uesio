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
	"github.com/thecloudmasters/uesio/pkg/tls"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func GetRedirectMetadata(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	integrationName := fmt.Sprintf("%s.%s", vars["namespace"], vars["name"])
	session := middleware.GetSession(r)
	integrationConnection, err := datasource.GetIntegrationConnection(r.Context(), integrationName, session, nil)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid integration", err))
		return
	}
	conf, err := oauth.GetConfig(integrationConnection.GetCredentials(), fmt.Sprintf("%s://%s", tls.ServeAppDefaultScheme(), r.Host))
	if err != nil {
		ctlutil.HandleError(r.Context(), w, exceptions.NewForbiddenException("invalid integration configuration: "+err.Error()))
		return
	}
	redirectMetadata, err := oauth.GetRedirectMetadata(conf, integrationName, session)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, errors.New("unable to generate a state token"))
		return
	}
	filejson.RespondJSON(w, r, redirectMetadata)
}

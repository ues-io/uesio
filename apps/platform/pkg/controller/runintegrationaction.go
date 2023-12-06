package controller

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type RunIntegrationActionResponse struct {
}

// TODO: Not used yet.
func RunIntegrationAction(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]

	integrationId := fmt.Sprintf("%s.%s", namespace, name)
	actionName := vars["action"]

	params, err := getParamsFromRequestBody(r)

	session := middleware.GetSession(r)
	connection, err := datasource.GetPlatformConnection(&wire.MetadataCache{}, session, nil)
	if err != nil {
		HandleError(w, errors.New("Unable to obtain platform connection: "+err.Error()))
		return
	}

	ic, err := datasource.GetIntegrationConnection(integrationId, session, connection)
	if err != nil {
		HandleError(w, err)
		return
	}
	result, err := datasource.RunIntegrationAction(ic, actionName, params, connection)
	if err != nil {
		HandleError(w, err)
		return
	}
	fmt.Printf("result is %v \n", result)
	//
	//file.RespondJSON(w, r, &bot.BotResponse{
	//	Params:  returnParams,
	//	Success: true,
	//})
}

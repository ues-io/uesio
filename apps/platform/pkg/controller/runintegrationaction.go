package controller

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type RunIntegrationActionResponse struct {
}

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

func GetIntegrationActionParams(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]
	actionKey := vars["action"]

	session := middleware.GetSession(r)
	connection, err := datasource.GetPlatformConnection(&wire.MetadataCache{}, session, nil)
	if err != nil {
		HandleError(w, errors.New("Unable to obtain platform connection: "+err.Error()))
		return
	}

	// Load the integration and integration type
	integrationKey := fmt.Sprintf("%s.%s", namespace, name)
	integration, err := datasource.GetIntegration(integrationKey, session, connection)
	if err != nil {
		HandleError(w, err)
		return
	}
	integrationTypeName := integration.GetType()
	integrationType, err := datasource.GetIntegrationType(integrationTypeName, session, connection)
	if err != nil {
		HandleError(w, err)
		return
	}
	actionBotKey, err := datasource.GetIntegrationActionBotName(integration, integrationType, actionKey, session, connection)
	if err != nil {
		HandleError(w, err)
		return
	}
	actionBotNamespace, actionBotName, err := meta.ParseKey(actionBotKey)
	if err != nil {
		HandleError(w, err)
		return
	}
	robot := meta.NewRunActionBot(actionBotNamespace, actionBotName)
	err = bundle.Load(robot, session, nil)
	if err != nil {
		HandleError(w, err)
		return
	}
	file.RespondJSON(w, r, getParamResponse(robot.Params))
}

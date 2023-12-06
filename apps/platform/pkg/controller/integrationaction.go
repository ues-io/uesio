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
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type RunIntegrationActionResponse struct {
}

func RunIntegrationAction(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	// The Integration namespace/name
	namespace := vars["namespace"]
	name := vars["name"]
	integrationId := fmt.Sprintf("%s.%s", namespace, name)
	// The action's name, or fully-qualified metadata key
	actionKey := r.URL.Query().Get("action")
	if actionKey == "" {
		HandleError(w, exceptions.NewBadRequestException("action parameter is required"))
		return
	}

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
	result, err := datasource.RunIntegrationAction(ic, actionKey, params, connection)
	if err != nil {
		HandleError(w, err)
		return
	}
	// If the type is a channel, stream chunks from it to the client
	switch v := result.(type) {
	case chan []byte:
		w.Header().Set("Transfer-Encoding", "chunked")
		for chunk := range v {
			fmt.Println("writing chunk")
			if _, err := w.Write(chunk); err != nil {
				HandleError(w, err)
				return
			}
		}
	default:
		// Send the response to the client as JSON
		file.RespondJSON(w, r, result)
	}
}

// GetIntegrationActionParams returns metadata about the parameters for an integration action.
// This can come from one of two sources:
//  1. the integration action - each action can define its params
//  2. the action's associated bot - if an action does NOT define its params,
//     the action's params will default to the associated Bot's params.
func GetIntegrationActionParams(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	// The namespace and name of the integration type
	namespace := vars["namespace"]
	name := vars["name"]
	// The action's name, or fully-qualified metadata key
	actionKey := r.URL.Query().Get("action")
	if actionKey == "" {
		HandleError(w, exceptions.NewBadRequestException("action parameter is required"))
		return
	}

	session := middleware.GetSession(r)
	connection, err := datasource.GetPlatformConnection(&wire.MetadataCache{}, session, nil)
	if err != nil {
		HandleError(w, errors.New("Unable to obtain platform connection: "+err.Error()))
		return
	}

	// Load the integration and integration type
	integrationTypeName := fmt.Sprintf("%s.%s", namespace, name)
	integrationType, err := datasource.GetIntegrationType(integrationTypeName, session, connection)
	if err != nil {
		HandleError(w, err)
		return
	}
	// The action itself MUST exist as a baseline.
	action, err := datasource.GetIntegrationAction(integrationTypeName, actionKey, session, connection)
	if err != nil {
		HandleError(w, err)
		return
	}
	var actionParams meta.BotParams
	// 1. Priority 1 --- read params off of the Integration Action itself.
	if action.Params != nil && len(action.Params) > 0 {
		actionParams = action.Params
	} else {
		// 2. Fallback --- read params off of the associated Bot.
		actionBotKey, err := datasource.GetIntegrationActionBotName(action, integrationType)
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
		actionParams = robot.Params
	}

	// If we couldn't find any parameters --- return an error
	if actionParams == nil || len(actionParams) < 1 {
		HandleError(w, exceptions.NewNotFoundException("could not find any parameters for this action"))
		return
	}

	file.RespondJSON(w, r, getParamResponse(actionParams))
}

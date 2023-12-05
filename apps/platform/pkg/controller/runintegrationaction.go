package controller

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

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
	metadataType := strings.ToUpper(vars["type"])
	session := middleware.GetSession(r)

	if metadataType != "GENERATOR" && metadataType != "LISTENER" && metadataType != "RUNACTION" {
		HandleError(w, exceptions.NewBadRequestException("Wrong bot type"))
		return
	}

	var robot *meta.Bot
	if metadataType == "GENERATOR" {
		robot = meta.NewGeneratorBot(namespace, name)
	} else if metadataType == "LISTENER" {
		robot = meta.NewListenerBot(namespace, name)
	} else if metadataType == "RUNACTION" {
		robot = meta.NewRunActionBot(namespace, name)
	}

	err := bundle.Load(robot, session, nil)
	if err != nil {
		HandleError(w, err)
		return
	}

	file.RespondJSON(w, r, getParamResponse(robot.Params))
}

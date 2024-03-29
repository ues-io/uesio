package controller

import (
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func getParamConditionsResponse(conditions []meta.BotParamCondition) []meta.BotParamConditionResponse {

	var response []meta.BotParamConditionResponse

	for _, condition := range conditions {
		response = append(response, meta.BotParamConditionResponse(condition))
	}

	return response

}

func getParamResponse(params meta.BotParams) meta.BotParamsResponse {
	response := meta.BotParamsResponse{}

	for _, param := range params {
		response = append(response, meta.BotParamResponse{
			Name:         param.Name,
			Label:        param.Label,
			Prompt:       param.Prompt,
			Type:         param.Type,
			MetadataType: param.MetadataType,
			Grouping:     param.Grouping,
			Default:      param.Default,
			Choices:      param.Choices,
			SelectList:   param.SelectList,
			Required:     param.Required,
			Conditions:   getParamConditionsResponse(param.Conditions),
		})
	}

	return response
}

func GetBotParams(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]
	metadataType := strings.ToUpper(vars["type"])
	session := middleware.GetSession(r)

	if metadataType != "GENERATOR" && metadataType != "LISTENER" && metadataType != "RUNACTION" {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("Wrong bot type"))
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
		ctlutil.HandleError(w, err)
		return
	}

	filejson.RespondJSON(w, r, getParamResponse(robot.Params))
}

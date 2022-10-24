package controller

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func GetParamConditionsResponse(conditions []meta.BotParamCondition) []meta.BotParamConditionResponse {
	response := []meta.BotParamConditionResponse{}

	for _, condition := range conditions {
		response = append(response, meta.BotParamConditionResponse{
			Param: condition.Param,
			Value: condition.Value,
		})
	}

	return response

}

func GetParamResponse(params meta.BotParams) meta.BotParamsResponse {
	response := meta.BotParamsResponse{}

	for _, param := range params {
		response = append(response, meta.BotParamResponse{
			Name:         param.Name,
			Prompt:       param.Prompt,
			Type:         param.Type,
			MetadataType: param.MetadataType,
			Grouping:     param.Grouping,
			Default:      param.Default,
			Choices:      param.Choices,
			Conditions:   GetParamConditionsResponse(param.Conditions),
		})
	}

	return response
}

func GetBotParams(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]
	metadataType := vars["type"]
	session := middleware.GetSession(r)

	if metadataType != "generator" {
		http.Error(w, "Wrong bot type", http.StatusInternalServerError)
		return
	}

	robot := meta.NewGeneratorBot(namespace, name)

	err := bundle.Load(robot, session)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	respondJSON(w, r, GetParamResponse(robot.Params))
}

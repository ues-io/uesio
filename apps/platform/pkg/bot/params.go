package bot

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func getParamConditionsResponse(conditions []meta.BotParamCondition) []meta.BotParamConditionResponse {

	var response []meta.BotParamConditionResponse

	for _, condition := range conditions {
		response = append(response, meta.BotParamConditionResponse(condition))
	}

	return response

}

func GetParamResponse(params meta.BotParams) meta.BotParamsResponse {
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
			DisplayAs:    param.DisplayAs,
			Conditions:   getParamConditionsResponse(param.Conditions),
		})
	}

	return response
}

func GetBotParams(namespace, name, metadataType string, session *sess.Session) (meta.BotParamsResponse, error) {

	if metadataType != "GENERATOR" && metadataType != "LISTENER" && metadataType != "RUNACTION" {
		return nil, exceptions.NewBadRequestException(fmt.Sprintf("Wrong bot type: %s", metadataType), nil)
	}

	var robot *meta.Bot
	if metadataType == "GENERATOR" {
		robot = meta.NewGeneratorBot(namespace, name)
	} else if metadataType == "LISTENER" {
		robot = meta.NewListenerBot(namespace, name)
	} else if metadataType == "RUNACTION" {
		robot = meta.NewRunActionBot(namespace, name)
	}

	err := bundle.Load(robot, nil, session, nil)
	if err != nil {
		return nil, err
	}

	return GetParamResponse(robot.Params), nil

}

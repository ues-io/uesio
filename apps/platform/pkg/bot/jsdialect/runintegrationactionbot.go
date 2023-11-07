package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func NewRunIntegrationActionBotAPI(bot *meta.Bot, integrationConnection *adapt.IntegrationConnection, actionName string, params map[string]interface{}) *RunIntegrationActionBotAPI {
	return &RunIntegrationActionBotAPI{
		actionName: actionName,
		LogApi:     NewBotLogAPI(bot),
		Http:       NewBotHttpAPI(bot, integrationConnection),
		Params: &ParamsAPI{
			Params: params,
		},
		Results:               map[string]interface{}{},
		integrationConnection: integrationConnection,
	}
}

type RunIntegrationActionBotAPI struct {
	actionName            string
	Http                  *BotHttpAPI `bot:"http"`
	integrationConnection *adapt.IntegrationConnection
	LogApi                *BotLogAPI `bot:"log"`
	Params                *ParamsAPI `bot:"params"`
	Results               map[string]interface{}
	Errors                []string
}

func (b *RunIntegrationActionBotAPI) AddError(error string) {
	b.Errors = append(b.Errors, error)
}

func (b *RunIntegrationActionBotAPI) AddResult(key string, value interface{}) {
	b.Results[key] = value
}

func (b *RunIntegrationActionBotAPI) GetActionName() string {
	return b.actionName
}

func (b *RunIntegrationActionBotAPI) GetCredentials() map[string]interface{} {
	if b.integrationConnection == nil || b.integrationConnection.GetCredentials() == nil {
		return map[string]interface{}{}
	}
	return b.integrationConnection.GetCredentials().GetInterfaceMap()
}

func (b *RunIntegrationActionBotAPI) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValueFromKey(configValueKey, datasource.GetSiteAdminSession(b.integrationConnection.GetSession()))
}

func (b *RunIntegrationActionBotAPI) GetIntegration() *IntegrationMetadata {
	if b.integrationConnection == nil || b.integrationConnection.GetIntegration() == nil {
		return nil
	}
	return (*IntegrationMetadata)(b.integrationConnection.GetIntegration())
}

func (b *RunIntegrationActionBotAPI) GetSession() *SessionAPI {
	return NewSessionAPI(b.integrationConnection.GetSession())
}

func (b *RunIntegrationActionBotAPI) GetUser() *UserAPI {
	return NewUserAPI(b.integrationConnection.GetSession().GetContextUser())
}

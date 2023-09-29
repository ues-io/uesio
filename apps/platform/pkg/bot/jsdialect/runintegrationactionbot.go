package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func NewRunIntegrationActionBotAPI(
	bot *meta.Bot,
	integrationAction *meta.IntegrationAction,
	integrationConnection adapt.IntegrationConnection,
	params map[string]interface{},
	session *sess.Session,
	connection adapt.Connection,
) *RunIntegrationActionBotAPI {
	return &RunIntegrationActionBotAPI{
		actionName: integrationAction.Name,
		session:    session,
		connection: connection,
		LogApi:     NewBotLogAPI(bot),
		Http:       NewBotHttpAPI(bot, session),
		Params: &ParamsAPI{
			Params: params,
		},
		Results:               map[string]interface{}{},
		integrationConnection: integrationConnection,
	}
}

type RunIntegrationActionBotAPI struct {
	actionName            string
	connection            adapt.Connection
	session               *sess.Session
	Http                  *BotHttpAPI `bot:"http"`
	integrationConnection adapt.IntegrationConnection
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
	return configstore.GetValueFromKey(configValueKey, b.session)
}

func (b *RunIntegrationActionBotAPI) GetIntegration() *IntegrationMetadata {
	if b.integrationConnection == nil || b.integrationConnection.GetIntegration() == nil {
		return nil
	}
	return (*IntegrationMetadata)(b.integrationConnection.GetIntegration())
}

func (b *RunIntegrationActionBotAPI) GetSession() *SessionAPI {
	return NewSessionAPI(b.session)
}

func (b *RunIntegrationActionBotAPI) GetUser() *UserAPI {
	return NewUserAPI(b.session.GetContextUser())
}

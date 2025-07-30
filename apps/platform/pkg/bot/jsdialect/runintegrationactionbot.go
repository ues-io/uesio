package jsdialect

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func NewRunIntegrationActionBotAPI(ctx context.Context, bot *meta.Bot, integrationConnection *wire.IntegrationConnection, actionName string, params map[string]any) *RunIntegrationActionBotAPI {
	return &RunIntegrationActionBotAPI{
		actionName: actionName,
		LogApi:     NewBotLogAPI(ctx, bot),
		Http:       NewBotHttpAPI(ctx, integrationConnection),
		Params: &ParamsAPI{
			Params: params,
		},
		Results:               map[string]any{},
		integrationConnection: integrationConnection,
		ctx:                   ctx,
	}
}

type RunIntegrationActionBotAPI struct {
	actionName            string
	Http                  *BotHttpAPI `bot:"http"`
	integrationConnection *wire.IntegrationConnection
	LogApi                *BotLogAPI `bot:"log"`
	Params                *ParamsAPI `bot:"params"`
	Results               map[string]any
	Errors                []string
	// Intentionally maintaining a context here because this code is called from javascript so we have to keep track of the context
	// upon creation so we can use as the bot processes. This is an exception to the rule of avoiding keeping context in structs.
	ctx context.Context
}

func (b *RunIntegrationActionBotAPI) AddError(error string) {
	b.Errors = append(b.Errors, error)
}

func (b *RunIntegrationActionBotAPI) AddResult(key string, value any) {
	b.Results[key] = value
}

func (b *RunIntegrationActionBotAPI) GetActionName() string {
	return b.actionName
}

func (b *RunIntegrationActionBotAPI) GetCredentials() map[string]any {
	if b.integrationConnection == nil || b.integrationConnection.GetCredentials() == nil {
		return map[string]any{}
	}
	return b.integrationConnection.GetCredentials().GetInterfaceMap()
}

func (b *RunIntegrationActionBotAPI) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValue(b.ctx, configValueKey, datasource.GetSiteAdminSession(b.integrationConnection.GetSession()))
}

func (b *RunIntegrationActionBotAPI) GetIntegration() *IntegrationMetadata {
	if b.integrationConnection == nil || b.integrationConnection.GetIntegration() == nil {
		return nil
	}
	return &IntegrationMetadata{
		connection: b.integrationConnection,
	}
}

func (b *RunIntegrationActionBotAPI) GetSession() *SessionAPI {
	return NewSessionAPI(b.ctx, b.integrationConnection.GetSession())
}

func (b *RunIntegrationActionBotAPI) GetUser() *UserAPI {
	return NewUserAPI(b.integrationConnection.GetSession().GetContextUser())
}

func (b *RunIntegrationActionBotAPI) CallBot(botKey string, params map[string]any) (any, error) {
	return botCall(b.ctx, botKey, params, b.integrationConnection.GetSession(), b.integrationConnection.GetPlatformConnection())
}

func (b *RunIntegrationActionBotAPI) Save(collection string, changes wire.Collection, options *wire.SaveOptions) (*wire.Collection, error) {
	return botSave(b.ctx, collection, changes, options, b.integrationConnection.GetSession(), b.integrationConnection.GetPlatformConnection(), nil)
}

func (b *RunIntegrationActionBotAPI) Delete(collection string, deletes wire.Collection) error {
	return botDelete(b.ctx, collection, deletes, b.integrationConnection.GetSession(), b.integrationConnection.GetPlatformConnection(), nil)
}

func (b *RunIntegrationActionBotAPI) Load(request BotLoadOp) (*wire.Collection, error) {
	return botLoad(b.ctx, request, b.integrationConnection.GetSession(), b.integrationConnection.GetPlatformConnection(), nil)
}

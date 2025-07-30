package jsdialect

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type AfterSaveAPI struct {
	Inserts    *InsertsAPI `bot:"inserts"`
	Updates    *UpdatesAPI `bot:"updates"`
	Deletes    *DeletesAPI `bot:"deletes"`
	LogApi     *BotLogAPI  `bot:"log"`
	op         *wire.SaveOp
	session    *sess.Session
	connection wire.Connection
	AsAdmin    *AsAdminApi `bot:"asAdmin"`
	// Intentionally maintaining a context here because this code is called from javascript so we have to keep track of the context
	// upon creation so we can use as the bot processes. This is an exception to the rule of avoiding keeping context in structs.
	ctx context.Context
}

func NewAfterSaveAPI(ctx context.Context, bot *meta.Bot, request *wire.SaveOp, connection wire.Connection, session *sess.Session) *AfterSaveAPI {
	return &AfterSaveAPI{
		Inserts: &InsertsAPI{
			op: request,
		},
		Updates: &UpdatesAPI{
			op: request,
		},
		Deletes: &DeletesAPI{
			op: request,
		},
		LogApi:     NewBotLogAPI(ctx, bot),
		session:    session,
		op:         request,
		connection: connection,
		AsAdmin:    NewAsAdminAPI(ctx, session, connection),
		ctx:        ctx,
	}
}

func (as *AfterSaveAPI) AddError(message string) {
	as.op.AddError(exceptions.NewSaveException("", "", message, nil))
}

func (as *AfterSaveAPI) Save(collection string, changes wire.Collection, options *wire.SaveOptions) (*wire.Collection, error) {
	return botSave(as.ctx, collection, changes, options, as.session, as.connection, nil)
}

func (as *AfterSaveAPI) Delete(collection string, deletes wire.Collection) error {
	return botDelete(as.ctx, collection, deletes, as.session, as.connection, nil)
}

func (as *AfterSaveAPI) Load(request BotLoadOp) (*wire.Collection, error) {
	return botLoad(as.ctx, request, as.session, as.connection, nil)
}

func (as *AfterSaveAPI) RunIntegrationAction(integrationID string, action string, options any) (any, error) {
	return runIntegrationAction(as.ctx, integrationID, action, options, as.session, as.connection)
}

func (as *AfterSaveAPI) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValue(as.ctx, configValueKey, as.session)
}

func (as *AfterSaveAPI) CallBot(botKey string, params map[string]any) (any, error) {
	return botCall(as.ctx, botKey, params, as.session, as.connection)
}

func (as *AfterSaveAPI) GetHostUrl() (string, error) {
	return getHostUrl(as.ctx, as.session, as.connection)
}

func (as *AfterSaveAPI) GetFileUrl(sourceKey, sourcePath string) string {
	return getFileUrl(sourceKey, sourcePath)
}

func (as *AfterSaveAPI) MergeTemplate(templateString string, params map[string]any) (string, error) {
	return mergeTemplateString(templateString, params)
}

func (as *AfterSaveAPI) MergeTemplateFile(sourceKey, sourcePath string, params map[string]any) (string, error) {
	return mergeTemplateFile(as.ctx, sourceKey, sourcePath, params, as.session, as.connection)
}

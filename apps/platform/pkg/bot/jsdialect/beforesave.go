package jsdialect

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type BeforeSaveAPI struct {
	Inserts    *InsertsAPI `bot:"inserts"`
	Updates    *UpdatesAPI `bot:"updates"`
	Deletes    *DeletesAPI `bot:"deletes"`
	LogApi     *BotLogAPI  `bot:"log"`
	op         *wire.SaveOp
	session    *sess.Session
	connection wire.Connection
	// Intentionally maintaining a context here because this code is called from javascript so we have to keep track of the context
	// upon creation so we can use as the bot processes. This is an exception to the rule of avoiding keeping context in structs.
	ctx context.Context
}

func NewBeforeSaveAPI(ctx context.Context, bot *meta.Bot, op *wire.SaveOp, connection wire.Connection, session *sess.Session) *BeforeSaveAPI {
	return &BeforeSaveAPI{
		Inserts:    &InsertsAPI{op},
		Updates:    &UpdatesAPI{op},
		Deletes:    &DeletesAPI{op},
		LogApi:     NewBotLogAPI(ctx, bot),
		session:    session,
		op:         op,
		connection: connection,
		ctx:        ctx,
	}
}

func (bs *BeforeSaveAPI) AddError(message string) {
	bs.op.AddError(exceptions.NewSaveException("", "", message, nil))
}

func (bs *BeforeSaveAPI) Save(collection string, changes wire.Collection, options *wire.SaveOptions) (*wire.Collection, error) {
	return botSave(bs.ctx, collection, changes, options, bs.session, bs.connection, nil)
}

func (bs *BeforeSaveAPI) Delete(collection string, deletes wire.Collection) error {
	return botDelete(bs.ctx, collection, deletes, bs.session, bs.connection, nil)
}

func (bs *BeforeSaveAPI) Load(request BotLoadOp) (*wire.Collection, error) {
	return botLoad(bs.ctx, request, bs.session, bs.connection, nil)
}

func (bs *BeforeSaveAPI) RunIntegrationAction(integrationID string, action string, options any) (any, error) {
	return runIntegrationAction(bs.ctx, integrationID, action, options, bs.session, bs.connection)
}

func (bs *BeforeSaveAPI) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValue(bs.ctx, configValueKey, bs.session)
}

func (bs *BeforeSaveAPI) CallBot(botKey string, params map[string]any) (any, error) {
	return botCall(bs.ctx, botKey, params, bs.session, bs.connection)
}

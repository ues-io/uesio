package jsdialect

import (
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
}

func NewBeforeSaveAPI(bot *meta.Bot, op *wire.SaveOp, connection wire.Connection, session *sess.Session) *BeforeSaveAPI {
	return &BeforeSaveAPI{
		Inserts:    &InsertsAPI{op},
		Updates:    &UpdatesAPI{op},
		Deletes:    &DeletesAPI{op},
		LogApi:     NewBotLogAPI(bot, session.Context()),
		session:    session,
		op:         op,
		connection: connection,
	}
}

func (bs *BeforeSaveAPI) AddError(message string) {
	bs.op.AddError(exceptions.NewSaveException("", "", message))
}

func (bs *BeforeSaveAPI) Save(collection string, changes wire.Collection, options *wire.SaveOptions) (*wire.Collection, error) {
	return botSave(collection, changes, options, bs.session, bs.connection, nil)
}

func (bs *BeforeSaveAPI) Delete(collection string, deletes wire.Collection) error {
	return botDelete(collection, deletes, bs.session, bs.connection, nil)
}

func (bs *BeforeSaveAPI) Load(request BotLoadOp) (*wire.Collection, error) {
	return botLoad(request, bs.session, bs.connection, nil)
}

func (bs *BeforeSaveAPI) RunIntegrationAction(integrationID string, action string, options interface{}) (interface{}, error) {
	return runIntegrationAction(integrationID, action, options, bs.session, bs.connection)
}

func (bs *BeforeSaveAPI) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValueFromKey(configValueKey, bs.session)
}

func (bs *BeforeSaveAPI) CallBot(botKey string, params map[string]interface{}) (interface{}, error) {
	return botCall(botKey, params, bs.session, bs.connection)
}

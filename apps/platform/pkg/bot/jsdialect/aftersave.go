package jsdialect

import (
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
	AsAdmin    AsAdminApi `bot:"asAdmin"`
}

func NewAfterSaveAPI(bot *meta.Bot, request *wire.SaveOp, connection wire.Connection, session *sess.Session) *AfterSaveAPI {
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
		LogApi:     NewBotLogAPI(bot, session.Context()),
		session:    session,
		op:         request,
		connection: connection,
		AsAdmin: AsAdminApi{
			session:    session,
			connection: connection,
		},
	}
}

func (as *AfterSaveAPI) AddError(message string) {
	as.op.AddError(exceptions.NewSaveException("", "", message))
}

func (as *AfterSaveAPI) Save(collection string, changes wire.Collection) (*wire.Collection, error) {
	return botSave(collection, changes, as.session, as.connection)
}

func (as *AfterSaveAPI) Delete(collection string, deletes wire.Collection) error {
	return botDelete(collection, deletes, as.session, as.connection)
}

func (as *AfterSaveAPI) Load(request BotLoadOp) (*wire.Collection, error) {
	return botLoad(request, as.session, as.connection)
}

func (as *AfterSaveAPI) RunIntegrationAction(integrationID string, action string, options interface{}) (interface{}, error) {
	return runIntegrationAction(integrationID, action, options, as.session, as.connection)
}

func (as *AfterSaveAPI) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValueFromKey(configValueKey, as.session)
}

func (as *AfterSaveAPI) CallBot(botKey string, params map[string]interface{}) (interface{}, error) {
	return botCall(botKey, params, as.session, as.connection)
}

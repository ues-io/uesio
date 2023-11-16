package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type AfterSaveAPI struct {
	Inserts    *InsertsAPI `bot:"inserts"`
	Updates    *UpdatesAPI `bot:"updates"`
	Deletes    *DeletesAPI `bot:"deletes"`
	op         *adapt.SaveOp
	session    *sess.Session
	connection adapt.Connection
	AsAdmin    AdminCallBotAPI `bot:"asAdmin"`
}

func NewAfterSaveAPI(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) *AfterSaveAPI {
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
		session:    session,
		op:         request,
		connection: connection,
		AsAdmin: AdminCallBotAPI{
			Session:    session,
			connection: connection,
		},
	}
}

func (as *AfterSaveAPI) AddError(message string) {
	as.op.AddError(adapt.NewSaveError("", "", message))
}

func (as *AfterSaveAPI) Save(collection string, changes adapt.Collection) error {
	return botSave(collection, changes, as.session, as.connection)
}

func (bs *AfterSaveAPI) Load(request BotLoadOp) (*adapt.Collection, error) {
	return botLoad(request, bs.session, bs.connection)
}

func (bs *AfterSaveAPI) RunIntegrationAction(integrationID string, action string, options interface{}) (interface{}, error) {
	return runIntegrationAction(integrationID, action, options, bs.session, bs.connection)
}

func (bs *AfterSaveAPI) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValueFromKey(configValueKey, bs.session)
}

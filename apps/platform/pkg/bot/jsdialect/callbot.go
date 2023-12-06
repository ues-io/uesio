package jsdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type AdminCallBotAPI struct {
	session    *sess.Session
	connection wire.Connection
}

func (acba *AdminCallBotAPI) Save(collection string, changes wire.Collection) error {
	return botSave(collection, changes, datasource.GetSiteAdminSession(acba.session), acba.connection)
}

func (acba *AdminCallBotAPI) Delete(collection string, deletes wire.Collection) error {
	return botDelete(collection, deletes, datasource.GetSiteAdminSession(acba.session), acba.connection)
}

func (acba *AdminCallBotAPI) RunIntegrationAction(integrationID string, action string, options interface{}) (interface{}, error) {
	return runIntegrationAction(integrationID, action, options, datasource.GetSiteAdminSession(acba.session), acba.connection)
}

func (acba *AdminCallBotAPI) CallBot(botKey string, params map[string]interface{}) (interface{}, error) {
	return botCall(botKey, params, acba.session, acba.connection)
}

func (acba *AdminCallBotAPI) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValueFromKey(configValueKey, datasource.GetSiteAdminSession(acba.session))
}

func (acba *AdminCallBotAPI) Load(request BotLoadOp) (*wire.Collection, error) {
	return botLoad(request, datasource.GetSiteAdminSession(acba.session), acba.connection)
}

func NewCallBotAPI(bot *meta.Bot, session *sess.Session, connection wire.Connection, params map[string]interface{}) *CallBotAPI {
	return &CallBotAPI{
		Session: session,
		Params: &ParamsAPI{
			Params: params,
		},
		AsAdmin: AdminCallBotAPI{
			session:    session,
			connection: connection,
		},
		connection: connection,
		Results:    map[string]interface{}{},
		LogApi:     NewBotLogAPI(bot),
		Http:       NewBotHttpAPI(bot, wire.NewIntegrationConnection(nil, nil, session, nil, connection)),
	}
}

type CallBotAPI struct {
	Session    *sess.Session
	Params     *ParamsAPI `bot:"params"`
	connection wire.Connection
	Results    map[string]interface{}
	AsAdmin    AdminCallBotAPI `bot:"asAdmin"`
	LogApi     *BotLogAPI      `bot:"log"`
	Http       *BotHttpAPI     `bot:"http"`
}

func (cba *CallBotAPI) AddResult(key string, value interface{}) {
	cba.Results[key] = value
}

func (cba *CallBotAPI) Save(collection string, changes wire.Collection) error {
	return botSave(collection, changes, cba.Session, cba.connection)
}

func (cba *CallBotAPI) Delete(collection string, deletes wire.Collection) error {
	return botDelete(collection, deletes, cba.Session, cba.connection)
}

func (cba *CallBotAPI) Load(request BotLoadOp) (*wire.Collection, error) {
	return botLoad(request, cba.Session, cba.connection)
}

func (cba *CallBotAPI) RunIntegrationAction(integrationID string, action string, options interface{}) (interface{}, error) {
	return runIntegrationAction(integrationID, action, options, cba.Session, cba.connection)
}

func (cba *CallBotAPI) CallBot(botKey string, params map[string]interface{}) (interface{}, error) {
	return botCall(botKey, params, cba.Session, cba.connection)
}

func (cba *CallBotAPI) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValueFromKey(configValueKey, cba.Session)
}

func (cba *CallBotAPI) GetSession() *SessionAPI {
	return NewSessionAPI(cba.Session)
}

func (cba *CallBotAPI) GetUser() *UserAPI {
	return NewUserAPI(cba.Session.GetContextUser())
}

func (cba *CallBotAPI) GetCollectionMetadata(collectionKey string) (*BotCollectionMetadata, error) {
	if cba.connection == nil {
		return nil, errors.New("no collection metadata available for this connection")
	}
	collectionMetadata, err := cba.connection.GetMetadata().GetCollection(collectionKey)
	if err != nil {
		return nil, err
	}
	return NewBotCollectionMetadata(collectionMetadata), nil
}

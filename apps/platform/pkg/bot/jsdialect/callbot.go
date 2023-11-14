package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type AdminCallBotAPI struct {
	Session    *sess.Session
	Connection adapt.Connection
}

func (acba *AdminCallBotAPI) Save(collection string, changes adapt.Collection) error {
	return botSave(collection, changes, datasource.GetSiteAdminSession(acba.Session), acba.Connection)
}

func (acba *AdminCallBotAPI) Delete(collection string, deletes adapt.Collection) error {
	return botDelete(collection, deletes, datasource.GetSiteAdminSession(acba.Session), acba.Connection)
}

func (acba *AdminCallBotAPI) RunIntegrationAction(integrationID string, action string, options interface{}) (interface{}, error) {
	return runIntegrationAction(integrationID, action, options, datasource.GetSiteAdminSession(acba.Session))
}

func (acba *AdminCallBotAPI) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValueFromKey(configValueKey, datasource.GetSiteAdminSession(acba.Session))
}

func (acba *AdminCallBotAPI) Load(request BotLoadOp) (*adapt.Collection, error) {
	return botLoad(request, datasource.GetSiteAdminSession(acba.Session), acba.Connection)
}

func NewCallBotAPI(bot *meta.Bot, session *sess.Session, connection adapt.Connection, params map[string]interface{}) *CallBotAPI {
	return &CallBotAPI{
		Session: session,
		Params: &ParamsAPI{
			Params: params,
		},
		AsAdmin: AdminCallBotAPI{
			Session:    session,
			Connection: connection,
		},
		Connection: connection,
		Results:    map[string]interface{}{},
		LogApi:     NewBotLogAPI(bot),
		Http:       NewBotHttpAPI(bot, adapt.NewIntegrationConnection(nil, nil, session, nil)),
	}
}

type CallBotAPI struct {
	Session    *sess.Session
	Params     *ParamsAPI `bot:"params"`
	Connection adapt.Connection
	Results    map[string]interface{}
	AsAdmin    AdminCallBotAPI `bot:"asAdmin"`
	LogApi     *BotLogAPI      `bot:"log"`
	Http       *BotHttpAPI     `bot:"http"`
}

func (cba *CallBotAPI) AddResult(key string, value interface{}) {
	cba.Results[key] = value
}

func (cba *CallBotAPI) Save(collection string, changes adapt.Collection) error {
	return botSave(collection, changes, cba.Session, cba.Connection)
}

func (cba *CallBotAPI) Delete(collection string, deletes adapt.Collection) error {
	return botDelete(collection, deletes, cba.Session, cba.Connection)
}

func (bs *CallBotAPI) Load(request BotLoadOp) (*adapt.Collection, error) {
	return botLoad(request, bs.Session, bs.Connection)
}

func (bs *CallBotAPI) RunIntegrationAction(integrationID string, action string, options interface{}) (interface{}, error) {
	return runIntegrationAction(integrationID, action, options, bs.Session)
}

func (bs *CallBotAPI) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValueFromKey(configValueKey, bs.Session)
}

func (cba *CallBotAPI) GetSession() *SessionAPI {
	return NewSessionAPI(cba.Session)
}

func (cba *CallBotAPI) GetUser() *UserAPI {
	return NewUserAPI(cba.Session.GetContextUser())
}

package jsdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func NewCallBotAPI(bot *meta.Bot, session *sess.Session, connection wire.Connection, params map[string]interface{}) *CallBotAPI {
	return &CallBotAPI{
		Session: session,
		Params: &ParamsAPI{
			Params: params,
		},
		AsAdmin: AsAdminApi{
			session:    session,
			connection: connection,
		},
		connection: connection,
		bot:        bot,
		Results:    map[string]interface{}{},
		LogApi:     NewBotLogAPI(bot, session.Context()),
		Http:       NewBotHttpAPI(wire.NewIntegrationConnection(nil, nil, session, nil, connection)),
	}
}

type CallBotAPI struct {
	Session    *sess.Session
	Params     *ParamsAPI `bot:"params"`
	connection wire.Connection
	bot        *meta.Bot
	Results    map[string]interface{}
	AsAdmin    AsAdminApi  `bot:"asAdmin"`
	LogApi     *BotLogAPI  `bot:"log"`
	Http       *BotHttpAPI `bot:"http"`
}

func (cba *CallBotAPI) AddResult(key string, value interface{}) {
	cba.Results[key] = value
}

func (cba *CallBotAPI) Save(collection string, changes wire.Collection) (*wire.Collection, error) {
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

func (cba *CallBotAPI) GetNamespace() string {
	return cba.bot.GetNamespace()
}

func (cba *CallBotAPI) GetName() string {
	return cba.bot.Name
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

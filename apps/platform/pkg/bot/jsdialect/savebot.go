package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type SaveRequestMetadata struct {
	// NOTE: We have separate structs for Bots to ensure that we don't accidentally expose sensitive API methods
	// to Bots, since all public API methods defined on a struct are accessible to Bots.
	CollectionMetadata *BotCollectionMetadata `bot:"collectionMetadata"`
	CollectionName     string                 `bot:"collection"`
	Upsert             bool                   `bot:"upsert"`
}

func NewSaveRequestMetadata(op *wire.SaveOp) *SaveRequestMetadata {
	return &SaveRequestMetadata{
		CollectionMetadata: NewBotCollectionMetadata(op.Metadata),
		CollectionName:     op.Metadata.GetFullName(),
		Upsert:             op.Options != nil && op.Options.Upsert,
	}
}

func NewSaveBotAPI(bot *meta.Bot, connection wire.Connection, saveOp *wire.SaveOp, integrationConnection *wire.IntegrationConnection) *SaveBotAPI {
	return &SaveBotAPI{
		saveOp:                saveOp,
		connection:            connection,
		integrationConnection: integrationConnection,

		Http:                NewBotHttpAPI(bot, integrationConnection),
		Deletes:             &DeletesAPI{saveOp},
		Inserts:             &InsertsAPI{saveOp},
		Updates:             &UpdatesAPI{saveOp},
		LogApi:              NewBotLogAPI(bot),
		SaveRequestMetadata: NewSaveRequestMetadata(saveOp),
	}
}

type SaveBotAPI struct {
	// PRIVATE
	saveOp                *wire.SaveOp
	connection            wire.Connection
	integrationConnection *wire.IntegrationConnection

	// PUBLIC
	SaveRequestMetadata *SaveRequestMetadata `bot:"saveRequest"`
	Inserts             *InsertsAPI          `bot:"inserts"`
	Updates             *UpdatesAPI          `bot:"updates"`
	Deletes             *DeletesAPI          `bot:"deletes"`
	LogApi              *BotLogAPI           `bot:"log"`
	Http                *BotHttpAPI          `bot:"http"`
}

// PRIVATE access to the session
func (sba *SaveBotAPI) getSession() *sess.Session {
	return sba.integrationConnection.GetSession()
}

func (sba *SaveBotAPI) GetCredentials() map[string]interface{} {
	if sba.integrationConnection == nil || sba.integrationConnection.GetCredentials() == nil {
		return map[string]interface{}{}
	}
	return sba.integrationConnection.GetCredentials().GetInterfaceMap()
}

func (sba *SaveBotAPI) GetIntegration() *IntegrationMetadata {
	if sba.integrationConnection == nil || sba.integrationConnection.GetIntegration() == nil {
		return nil
	}
	return (*IntegrationMetadata)(sba.integrationConnection.GetIntegration())
}

func (sba *SaveBotAPI) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValueFromKey(configValueKey, sba.getSession())
}

func (sba *SaveBotAPI) GetSession() *SessionAPI {
	return NewSessionAPI(sba.getSession())
}

func (sba *SaveBotAPI) GetUser() *UserAPI {
	return NewUserAPI(sba.getSession().GetContextUser())
}

func (sba *SaveBotAPI) AddError(message, fieldId, recordId string) {
	sba.saveOp.AddError(exceptions.NewSaveException(recordId, fieldId, message))
}

func (sba *SaveBotAPI) CallBot(botKey string, params map[string]interface{}) (interface{}, error) {
	return botCall(botKey, params, sba.getSession(), sba.connection)
}

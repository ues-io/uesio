package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type SaveRequestMetadata struct {
	// NOTE: We have separate structs for Bots to ensure that we don't accidentally expose sensitive API methods
	// to Bots, since all public API methods defined on a struct are accessible to Bots.
	CollectionMetadata *BotCollectionMetadata `bot:"collectionMetadata"`
	CollectionName     string                 `bot:"collection"`
	Upsert             bool                   `bot:"upsert"`
}

func NewSaveRequestMetadata(op *adapt.SaveOp) *SaveRequestMetadata {
	return &SaveRequestMetadata{
		CollectionMetadata: NewBotCollectionMetadata(op.Metadata),
		CollectionName:     op.Metadata.GetFullName(),
		Upsert:             op.Options != nil && op.Options.Upsert,
	}
}

func NewSaveBotAPI(bot *meta.Bot, session *sess.Session, connection adapt.Connection, saveOp *adapt.SaveOp, integrationConnection adapt.IntegrationConnection) *SaveBotAPI {
	return &SaveBotAPI{
		session:    session,
		saveOp:     saveOp,
		connection: connection,

		Http:                  NewBotHttpAPI(bot, session, integrationConnection),
		IntegrationConnection: integrationConnection,
		Deletes:               &DeletesAPI{saveOp},
		Inserts:               &InsertsAPI{saveOp},
		Updates:               &UpdatesAPI{saveOp},
		LogApi:                NewBotLogAPI(bot),
		SaveRequestMetadata:   NewSaveRequestMetadata(saveOp),
	}
}

type SaveBotAPI struct {
	session               *sess.Session
	saveOp                *adapt.SaveOp
	connection            adapt.Connection
	SaveRequestMetadata   *SaveRequestMetadata `bot:"saveRequest"`
	Inserts               *InsertsAPI          `bot:"inserts"`
	Updates               *UpdatesAPI          `bot:"updates"`
	Deletes               *DeletesAPI          `bot:"deletes"`
	LogApi                *BotLogAPI           `bot:"log"`
	Http                  *BotHttpAPI          `bot:"http"`
	IntegrationConnection adapt.IntegrationConnection
}

func (sba *SaveBotAPI) GetCredentials() map[string]interface{} {
	if sba.IntegrationConnection == nil || sba.IntegrationConnection.GetCredentials() == nil {
		return map[string]interface{}{}
	}
	return sba.IntegrationConnection.GetCredentials().GetInterfaceMap()
}

func (sba *SaveBotAPI) GetIntegration() *IntegrationMetadata {
	if sba.IntegrationConnection == nil || sba.IntegrationConnection.GetIntegration() == nil {
		return nil
	}
	return (*IntegrationMetadata)(sba.IntegrationConnection.GetIntegration())
}

func (sba *SaveBotAPI) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValueFromKey(configValueKey, sba.session)
}

func (sba *SaveBotAPI) GetSession() *SessionAPI {
	return NewSessionAPI(sba.session)
}

func (sba *SaveBotAPI) GetUser() *UserAPI {
	return NewUserAPI(sba.session.GetContextUser())
}

func (sba *SaveBotAPI) AddError(message, fieldId, recordId string) {
	sba.saveOp.AddError(&adapt.SaveError{
		RecordID: recordId,
		FieldID:  fieldId,
		Message:  message,
	})
}

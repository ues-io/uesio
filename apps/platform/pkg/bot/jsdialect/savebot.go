package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func NewSaveBotAPI(bot *meta.Bot, session *sess.Session, connection adapt.Connection, saveOp *adapt.SaveOp, integrationConnection adapt.IntegrationConnection) *SaveBotAPI {
	return &SaveBotAPI{
		session:    session,
		saveOp:     saveOp,
		connection: connection,
		Options:    &SaveOptionsAPI{Upsert: saveOp.Options != nil && saveOp.Options.Upsert},

		Http:                  NewBotHttpAPI(bot, session, integrationConnection),
		IntegrationConnection: integrationConnection,
		Deletes:               &DeletesAPI{saveOp},
		Inserts:               &InsertsAPI{saveOp},
		Updates:               &UpdatesAPI{saveOp},
		LogApi:                NewBotLogAPI(bot),
	}
}

type SaveBotAPI struct {
	session               *sess.Session
	saveOp                *adapt.SaveOp
	connection            adapt.Connection
	Options               *SaveOptionsAPI `bot:"saveOptions"`
	Inserts               *InsertsAPI     `bot:"inserts"`
	Updates               *UpdatesAPI     `bot:"updates"`
	Deletes               *DeletesAPI     `bot:"deletes"`
	LogApi                *BotLogAPI      `bot:"log"`
	Http                  *BotHttpAPI     `bot:"http"`
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

func (sba *SaveBotAPI) GetCollectionName() string {
	return sba.saveOp.Metadata.GetFullName()
}

func (sba *SaveBotAPI) AddError(message, fieldId, recordId string) {
	sba.saveOp.AddError(&adapt.SaveError{
		RecordID: recordId,
		FieldID:  fieldId,
		Message:  message,
	})
}

type SaveOptionsAPI struct {
	Upsert bool `bot:"upsert"`
}

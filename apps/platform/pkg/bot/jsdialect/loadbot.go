package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/integ"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func NewLoadBotAPI(bot *meta.Bot, session *sess.Session, connection adapt.Connection, loadOp *adapt.LoadOp, integrationConnection integ.IntegrationConnection) *LoadBotAPI {
	return &LoadBotAPI{
		Session:               session,
		LoadOp:                loadOp,
		Connection:            connection,
		LogApi:                NewBotLogAPI(bot),
		Http:                  NewBotHttpAPI(bot, session),
		IntegrationConnection: integrationConnection,
	}
}

type IntegrationMetadata meta.Integration

func (im *IntegrationMetadata) GetBaseURL() string {
	return im.BaseURL
}

type LoadBotAPI struct {
	Session               *sess.Session
	LoadOp                *adapt.LoadOp `bot:"loadRequest"`
	Connection            adapt.Connection
	LogApi                *BotLogAPI  `bot:"log"`
	Http                  *BotHttpAPI `bot:"http"`
	IntegrationConnection integ.IntegrationConnection
}

func (bs *LoadBotAPI) GetCredentials() map[string]interface{} {
	if bs.IntegrationConnection == nil || bs.IntegrationConnection.GetCredentials() == nil {
		return map[string]interface{}{}
	}
	return bs.IntegrationConnection.GetCredentials().GetInterfaceMap()
}

func (bs *LoadBotAPI) GetIntegration() *IntegrationMetadata {
	if bs.IntegrationConnection == nil || bs.IntegrationConnection.GetIntegration() == nil {
		return nil
	}
	return (*IntegrationMetadata)(bs.IntegrationConnection.GetIntegration())
}

func (bs *LoadBotAPI) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValueFromKey(configValueKey, bs.Session)
}

func (cba *LoadBotAPI) GetSession() *SessionAPI {
	return NewSessionAPI(cba.Session)
}

func (cba *LoadBotAPI) GetUser() *UserAPI {
	return NewUserAPI(cba.Session.GetContextUser())
}

// TODO: Is there a better or more performant way to do this???
func (cba *LoadBotAPI) SetData(data []map[string]interface{}) (bs *LoadBotAPI) {
	bs.LoadOp.Collection = &adapt.Collection{}
	for _, rawItem := range data {
		item := bs.LoadOp.Collection.NewItem()
		for k, v := range rawItem {
			item.SetField(k, v)
		}
	}
	return bs
}

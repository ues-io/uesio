package jsdialect

import (
	"github.com/teris-io/shortid"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func NewLoadBotAPI(bot *meta.Bot, session *sess.Session, connection adapt.Connection, loadOp *adapt.LoadOp, integrationConnection adapt.IntegrationConnection) *LoadBotAPI {
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
	IntegrationConnection adapt.IntegrationConnection
	loadErrors            []string
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

func (cba *LoadBotAPI) AddError(error string) {
	cba.loadErrors = append(cba.loadErrors, error)
}

func (cba *LoadBotAPI) AddRecord(record interface{}) {
	switch typedRecord := record.(type) {
	case map[string]interface{}:
		item := (adapt.Item)(typedRecord)
		// Make sure that the Item has a valid for its Id field. If not, generate a fake id.
		if val, err := item.GetField(adapt.ID_FIELD); err == nil || val == nil || val == "" {
			if shortId, shortIdErr := shortid.Generate(); shortIdErr != nil {
				item.SetField(adapt.ID_FIELD, shortId)
			}
		}
		cba.LoadOp.Collection.AddItem(&item)
	}
}

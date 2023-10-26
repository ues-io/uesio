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
		session:               session,
		LoadOp:                loadOp,
		connection:            connection,
		LogApi:                NewBotLogAPI(bot),
		Http:                  NewBotHttpAPI(bot, session),
		integrationConnection: integrationConnection,
	}
}

type LoadBotAPI struct {
	session               *sess.Session
	LoadOp                *adapt.LoadOp `bot:"loadRequest"`
	connection            adapt.Connection
	LogApi                *BotLogAPI  `bot:"log"`
	Http                  *BotHttpAPI `bot:"http"`
	integrationConnection adapt.IntegrationConnection
	loadErrors            []string
}

func (lb *LoadBotAPI) GetCredentials() map[string]interface{} {
	if lb.integrationConnection == nil || lb.integrationConnection.GetCredentials() == nil {
		return map[string]interface{}{}
	}
	return lb.integrationConnection.GetCredentials().GetInterfaceMap()
}

func (lb *LoadBotAPI) GetIntegration() *IntegrationMetadata {
	if lb.integrationConnection == nil || lb.integrationConnection.GetIntegration() == nil {
		return nil
	}
	return (*IntegrationMetadata)(lb.integrationConnection.GetIntegration())
}

func (lb *LoadBotAPI) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValueFromKey(configValueKey, lb.session)
}

func (lb *LoadBotAPI) GetSession() *SessionAPI {
	return NewSessionAPI(lb.session)
}

func (lb *LoadBotAPI) GetUser() *UserAPI {
	return NewUserAPI(lb.session.GetContextUser())
}

func (lb *LoadBotAPI) AddError(error string) {
	lb.loadErrors = append(lb.loadErrors, error)
}

func (lb *LoadBotAPI) AddRecord(record interface{}) {
	switch typedRecord := record.(type) {
	case map[string]interface{}:
		item := (adapt.Item)(typedRecord)
		// Make sure that the Item has a valid for its Id field. If not, generate a fake id.
		if val, err := item.GetField(adapt.ID_FIELD); err == nil || val == nil || val == "" {
			if shortId, shortIdErr := shortid.Generate(); shortIdErr != nil {
				item.SetField(adapt.ID_FIELD, shortId)
			}
		}
		lb.LoadOp.Collection.AddItem(&item)
	}
}

package jsdialect

import (
	"github.com/teris-io/shortid"

	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func NewLoadBotAPI(bot *meta.Bot, connection wire.Connection, loadOp *wire.LoadOp, integrationConnection *wire.IntegrationConnection) *LoadBotAPI {
	return &LoadBotAPI{
		// Private
		loadOp:                loadOp,
		connection:            connection,
		integrationConnection: integrationConnection,
		// Public
		LogApi:              NewBotLogAPI(bot, integrationConnection.Context()),
		Http:                NewBotHttpAPI(bot, integrationConnection),
		LoadRequestMetadata: NewLoadRequestMetadata(loadOp),
	}
}

func NewLoadRequestMetadata(op *wire.LoadOp) *LoadRequestMetadata {
	metadata, _ := op.GetCollectionMetadata()
	fields := make([]*wire.LoadRequestField, len(op.Fields))
	conditions := make([]*wire.LoadRequestCondition, len(op.Conditions))
	orders := make([]*wire.LoadRequestOrder, len(op.Order))
	for i := range op.Fields {
		fields[i] = &(op.Fields[i])
	}
	for i := range op.Conditions {
		conditions[i] = &(op.Conditions[i])
	}
	for i := range op.Order {
		orders[i] = &(op.Order[i])
	}
	return &LoadRequestMetadata{
		CollectionMetadata: NewBotCollectionMetadata(metadata),
		CollectionName:     op.CollectionName,
		Conditions:         conditions,
		Fields:             fields,
		Query:              op.Query,
		Order:              orders,
		BatchSize:          op.BatchSize,
		BatchNumber:        op.BatchNumber,
		LoadAll:            op.LoadAll,
	}
}

// NOTE: We have separate structs for Bots to ensure that we don't accidentally expose sensitive API methods
// to Bots, since all public API methods defined on a struct are accessible to Bots.

type LoadRequestMetadata struct {
	// PRIVATE
	CollectionMetadata *BotCollectionMetadata `bot:"collectionMetadata"`
	// Public
	CollectionName string                       `bot:"collection"`
	Conditions     []*wire.LoadRequestCondition `bot:"conditions"`
	Fields         []*wire.LoadRequestField     `bot:"fields"`
	Order          []*wire.LoadRequestOrder     `bot:"order"`
	Query          bool                         `bot:"query"`
	BatchSize      int                          `bot:"batchSize"`
	BatchNumber    int                          `bot:"batchNumber"`
	LoadAll        bool                         `bot:"loadAll"`
}

type LoadBotAPI struct {
	// Private
	connection            wire.Connection
	integrationConnection *wire.IntegrationConnection
	loadErrors            []string
	loadOp                *wire.LoadOp
	// Public
	Http                *BotHttpAPI          `bot:"http"`
	LoadRequestMetadata *LoadRequestMetadata `bot:"loadRequest"`
	LogApi              *BotLogAPI           `bot:"log"`
}

func (lb *LoadBotAPI) GetLoadErrors() []string {
	return lb.loadErrors
}

func (lb *LoadBotAPI) getSession() *sess.Session {
	return lb.integrationConnection.GetSession()
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
	return configstore.GetValueFromKey(configValueKey, lb.getSession())
}

func (lb *LoadBotAPI) GetSession() *SessionAPI {
	return NewSessionAPI(lb.getSession())
}

func (lb *LoadBotAPI) GetUser() *UserAPI {
	return NewUserAPI(lb.getSession().GetContextUser())
}

func (lb *LoadBotAPI) AddError(error string) {
	lb.loadErrors = append(lb.loadErrors, error)
}

func (lb *LoadBotAPI) CallBot(botKey string, params map[string]interface{}) (interface{}, error) {
	return botCall(botKey, params, lb.getSession(), lb.connection)
}

func (lb *LoadBotAPI) AddRecord(record interface{}) {
	switch typedRecord := record.(type) {
	case map[string]interface{}:
		item := lb.loadOp.Collection.NewItem()
		for key, typedField := range typedRecord {
			item.SetField(key, typedField)
		}
		// Make sure that the Item has a valid for its Id field. If not, generate a fake id.
		if val, err := item.GetField(wire.ID_FIELD); err == nil || val == nil || val == "" {
			if shortId, shortIdErr := shortid.Generate(); shortIdErr != nil {
				item.SetField(wire.ID_FIELD, shortId)
			}
		}
		lb.loadOp.Collection.AddItem(item)
	}
}

func (lb *LoadBotAPI) SetHasMoreRecords() {
	lb.loadOp.HasMoreBatches = true
}

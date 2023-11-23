package jsdialect

import (
	"github.com/teris-io/shortid"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func NewLoadBotAPI(bot *meta.Bot, connection adapt.Connection, loadOp *adapt.LoadOp, integrationConnection *adapt.IntegrationConnection) *LoadBotAPI {
	return &LoadBotAPI{
		// Private
		loadOp:                loadOp,
		connection:            connection,
		integrationConnection: integrationConnection,
		// Public
		LogApi:              NewBotLogAPI(bot),
		Http:                NewBotHttpAPI(bot, integrationConnection),
		LoadRequestMetadata: NewLoadRequestMetadata(loadOp),
	}
}

func NewLoadRequestMetadata(op *adapt.LoadOp) *LoadRequestMetadata {
	metadata, _ := op.GetCollectionMetadata()
	fields := make([]*adapt.LoadRequestField, len(op.Fields))
	conditions := make([]*adapt.LoadRequestCondition, len(op.Conditions))
	orders := make([]*adapt.LoadRequestOrder, len(op.Order))
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
	CollectionName string                        `bot:"collection"`
	Conditions     []*adapt.LoadRequestCondition `bot:"conditions"`
	Fields         []*adapt.LoadRequestField     `bot:"fields"`
	Order          []*adapt.LoadRequestOrder     `bot:"order"`
	Query          bool                          `bot:"query"`
	BatchSize      int                           `bot:"batchSize"`
	BatchNumber    int                           `bot:"batchNumber"`
	LoadAll        bool                          `bot:"loadAll"`
}

type LoadBotAPI struct {
	// Private
	connection            adapt.Connection
	integrationConnection *adapt.IntegrationConnection
	loadErrors            []string
	loadOp                *adapt.LoadOp
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

func (lb *LoadBotAPI) AddRecord(record interface{}) {
	switch typedRecord := record.(type) {
	case map[string]interface{}:
		item := lb.loadOp.Collection.NewItem()
		for key, typedField := range typedRecord {
			item.SetField(key, typedField)
		}
		// Make sure that the Item has a valid for its Id field. If not, generate a fake id.
		if val, err := item.GetField(adapt.ID_FIELD); err == nil || val == nil || val == "" {
			if shortId, shortIdErr := shortid.Generate(); shortIdErr != nil {
				item.SetField(adapt.ID_FIELD, shortId)
			}
		}
		lb.loadOp.Collection.AddItem(item)
	}
}

func (lb *LoadBotAPI) SetHasMoreRecords() {
	lb.loadOp.HasMoreBatches = true
}

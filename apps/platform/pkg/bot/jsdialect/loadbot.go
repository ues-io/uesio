package jsdialect

import (
	"github.com/teris-io/shortid"

	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func NewLoadBotAPI(bot *meta.Bot, loadOp *wire.LoadOp, integrationConnection *wire.IntegrationConnection) *LoadBotAPI {
	return &LoadBotAPI{
		// Private
		bot:                   bot,
		loadOp:                loadOp,
		integrationConnection: integrationConnection,
		// Public
		LogApi:              NewBotLogAPI(bot, integrationConnection.Context()),
		Http:                NewBotHttpAPI(integrationConnection),
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
	bot                   *meta.Bot
	integrationConnection *wire.IntegrationConnection
	errors                []string
	loadOp                *wire.LoadOp
	// Public
	Http                *BotHttpAPI          `bot:"http"`
	LoadRequestMetadata *LoadRequestMetadata `bot:"loadRequest"`
	LogApi              *BotLogAPI           `bot:"log"`
}

func (lb *LoadBotAPI) Load(request BotLoadOp) (*wire.Collection, error) {
	return botLoad(request, lb.integrationConnection.GetSession(), lb.integrationConnection.GetPlatformConnection(), nil)
}

func (lb *LoadBotAPI) GetErrors() []string {
	return lb.errors
}

func (lb *LoadBotAPI) getSession() *sess.Session {
	return lb.integrationConnection.GetSession()
}

func (lb *LoadBotAPI) GetCredentials() map[string]any {
	if lb.integrationConnection == nil || lb.integrationConnection.GetCredentials() == nil {
		return map[string]any{}
	}
	return lb.integrationConnection.GetCredentials().GetInterfaceMap()
}
func (lb *LoadBotAPI) GetCollectionMetadata(collectionKey string) (*BotCollectionMetadata, error) {
	metadata, err := lb.loadOp.GetMetadata()
	if err != nil {
		return nil, err
	}

	collectionMetadata, err := metadata.GetCollection(collectionKey)
	if err != nil {
		return nil, err
	}
	return NewBotCollectionMetadata(collectionMetadata), nil
}
func (lb *LoadBotAPI) GetIntegration() *IntegrationMetadata {
	if lb.integrationConnection == nil || lb.integrationConnection.GetIntegration() == nil {
		return nil
	}
	return &IntegrationMetadata{
		connection: lb.integrationConnection,
	}
}

func (lb *LoadBotAPI) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValue(configValueKey, lb.getSession())
}

func (lb *LoadBotAPI) GetSession() *SessionAPI {
	return NewSessionAPI(lb.getSession())
}

func (lb *LoadBotAPI) GetUser() *UserAPI {
	return NewUserAPI(lb.getSession().GetContextUser())
}

func (lb *LoadBotAPI) AddError(error string) {
	lb.errors = append(lb.errors, error)
}

func (lb *LoadBotAPI) CallBot(botKey string, params map[string]any) (any, error) {
	return botCall(botKey, params, lb.getSession(), lb.integrationConnection.GetPlatformConnection())
}

func (lb *LoadBotAPI) AddRecord(record any) {
	switch typedRecord := record.(type) {
	case map[string]any:
		item := lb.loadOp.Collection.NewItem()
		for key, typedField := range typedRecord {
			item.SetField(meta.GetFullyQualifiedKey(key, lb.bot.Namespace), typedField)
		}
		// Make sure that the Item has a valid for its Id field. If not, generate a fake id.
		if val, err := item.GetField(commonfields.Id); err == nil || val == nil || val == "" {
			if shortId, shortIdErr := shortid.Generate(); shortIdErr != nil {
				item.SetField(commonfields.Id, shortId)
			}
		}
		lb.loadOp.Collection.AddItem(item)
	}
}

func (lb *LoadBotAPI) SetHasMoreRecords() {
	lb.loadOp.HasMoreBatches = true
}

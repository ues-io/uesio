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
		// Private
		session:               session,
		loadOp:                loadOp,
		connection:            connection,
		integrationConnection: integrationConnection,
		// Public
		LogApi:              NewBotLogAPI(bot),
		Http:                NewBotHttpAPI(bot, session, integrationConnection),
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
		CollectionMetadata: &LoadRequestCollectionMetadata{
			fields:       metadata.Fields,
			Name:         metadata.Name,
			Namespace:    metadata.Namespace,
			Type:         metadata.Type,
			Createable:   metadata.Createable,
			Accessible:   metadata.Accessible,
			Updateable:   metadata.Updateable,
			Deleteable:   metadata.Deleteable,
			ExternalName: metadata.TableName,
			Label:        metadata.Label,
			PluralLabel:  metadata.PluralLabel,
		},
		CollectionName: op.CollectionName,
		Conditions:     conditions,
		Fields:         fields,
		Query:          op.Query,
		Order:          orders,
		BatchSize:      op.BatchSize,
		BatchNumber:    op.BatchNumber,
		LoadAll:        op.LoadAll,
	}
}

// NOTE: We have separate structs for Bots to ensure that we don't accidentally expose sensitive API methods
// to Bots, since all public API methods defined on a struct are accessible to Bots.

type LoadRequestMetadata struct {
	// PRIVATE
	CollectionMetadata *LoadRequestCollectionMetadata `bot:"collectionMetadata"`
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

type LoadRequestCollectionMetadata struct {
	// Private
	fields map[string]*adapt.FieldMetadata
	// Public
	Name         string `bot:"name"`
	Namespace    string `bot:"namespace"`
	Type         string `bot:"type"`
	Createable   bool   `bot:"createable"`
	Accessible   bool   `bot:"accessible"`
	Updateable   bool   `bot:"updateable"`
	Deleteable   bool   `bot:"deleteable"`
	ExternalName string `bot:"externalName"`
	Label        string `bot:"label"`
	PluralLabel  string `bot:"pluralLabel"`
}

func (cm *LoadRequestCollectionMetadata) GetFieldMetadata(fieldName string) *adapt.FieldMetadata {
	return cm.fields[fieldName]
}

func (cm *LoadRequestCollectionMetadata) GetAllFieldMetadata() map[string]*adapt.FieldMetadata {
	// Clone the map to prevent it being messed with by bots
	cloned := map[string]*adapt.FieldMetadata{}
	for k, v := range cm.fields {
		cloned[k] = v
	}
	return cloned
}

type LoadBotAPI struct {
	// Private
	connection            adapt.Connection
	integrationConnection adapt.IntegrationConnection
	loadErrors            []string
	loadOp                *adapt.LoadOp
	session               *sess.Session
	// Public
	Http                *BotHttpAPI          `bot:"http"`
	LoadRequestMetadata *LoadRequestMetadata `bot:"loadRequest"`
	LogApi              *BotLogAPI           `bot:"log"`
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
		lb.loadOp.Collection.AddItem(&item)
	}
}

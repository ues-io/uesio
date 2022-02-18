package datasource

import (
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// BeforeSaveAPI type
type BeforeSaveAPI struct {
	Inserts *InsertsAPI `bot:"inserts"`
	Updates *UpdatesAPI `bot:"updates"`
	Deletes *DeletesAPI `bot:"deletes"`
	errors  []string
	session *sess.Session
}

type BotLoadOp struct {
	Collection string                       `bot:"collection"`
	Fields     []adapt.LoadRequestField     `bot:"fields"`
	Conditions []adapt.LoadRequestCondition `bot:"conditions"`
	Order      []adapt.LoadRequestOrder     `bot:"order"`
}

func NewBeforeSaveAPI(op *adapt.SaveOp, metadata *adapt.CollectionMetadata, session *sess.Session) *BeforeSaveAPI {
	return &BeforeSaveAPI{
		Inserts: &InsertsAPI{
			inserts:  op.Inserts,
			metadata: metadata,
		},
		Updates: &UpdatesAPI{
			updates:  op.Updates,
			metadata: metadata,
		},
		Deletes: &DeletesAPI{
			deletes:  op.Deletes,
			metadata: metadata,
		},
		session: session,
	}
}

// AddError function
func (bs *BeforeSaveAPI) AddError(message string) {
	bs.errors = append(bs.errors, message)
}

// HasErrors function
func (bs *BeforeSaveAPI) HasErrors() bool {
	return len(bs.errors) > 0
}

// GetErrorString function
func (bs *BeforeSaveAPI) GetErrorString() string {
	return strings.Join(bs.errors, ", ")
}

func loadData(op *adapt.LoadOp, session *sess.Session) error {
	_, err := Load([]adapt.LoadOp{*op}, session)
	if err != nil {
		return err
	}
	if !op.HasMoreBatches {
		return nil
	}
	return loadData(op, session)
}

// Load function
func (bs *BeforeSaveAPI) Load(request BotLoadOp) (*adapt.Collection, error) {

	collection := &adapt.Collection{}

	op := &adapt.LoadOp{
		CollectionName: request.Collection,
		Collection:     collection,
		WireName:       "apibeforesave",
		Fields:         request.Fields,
		Conditions:     request.Conditions,
		Order:          request.Order,
		Query:          true,
	}

	err := loadData(op, bs.session)
	if err != nil {
		return nil, err
	}

	return collection, nil

}

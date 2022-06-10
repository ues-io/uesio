package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type BeforeSaveAPI struct {
	Inserts    *InsertsAPI `bot:"inserts"`
	Updates    *UpdatesAPI `bot:"updates"`
	Deletes    *DeletesAPI `bot:"deletes"`
	op         *adapt.SaveOp
	session    *sess.Session
	connection adapt.Connection
}

type BotLoadOp struct {
	Collection string                       `bot:"collection"`
	Fields     []adapt.LoadRequestField     `bot:"fields"`
	Conditions []adapt.LoadRequestCondition `bot:"conditions"`
	Order      []adapt.LoadRequestOrder     `bot:"order"`
}

func NewBeforeSaveAPI(op *adapt.SaveOp, connection adapt.Connection, session *sess.Session) *BeforeSaveAPI {
	return &BeforeSaveAPI{
		Inserts: &InsertsAPI{
			op: op,
		},
		Updates: &UpdatesAPI{
			op: op,
		},
		Deletes: &DeletesAPI{
			op: op,
		},
		session: session,
		op:      op,
	}
}

func (bs *BeforeSaveAPI) AddError(message string) {
	bs.op.AddError(adapt.NewSaveError("", "", message))
}

func loadData(op *adapt.LoadOp, session *sess.Session) error {

	_, err := Load([]*adapt.LoadOp{op}, session, nil)
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

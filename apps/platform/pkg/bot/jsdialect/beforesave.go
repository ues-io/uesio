package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
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
		session:    session,
		op:         op,
		connection: connection,
	}
}

func (bs *BeforeSaveAPI) AddError(message string) {
	bs.op.AddError(adapt.NewSaveError("", "", message))
}

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
		LoadAll:        true,
	}

	_, err := datasource.Load([]*adapt.LoadOp{op}, bs.session, &datasource.LoadOptions{
		Connections: datasource.GetConnectionMap(bs.connection),
		Metadata:    datasource.GetConnectionMetadata(bs.connection),
	})
	if err != nil {
		return nil, err
	}

	return collection, nil

}

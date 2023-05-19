package jsdialect

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
		session:    session,
		op:         op,
		connection: connection,
	}
}

func (bs *BeforeSaveAPI) AddError(message string) {
	bs.op.AddError(adapt.NewSaveError("", "", message, 5))
}

func (bs *BeforeSaveAPI) Load(request BotLoadOp) (*adapt.Collection, error) {
	return botLoad(request, bs.session, bs.connection)
}

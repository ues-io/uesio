package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type AfterSaveAPI struct {
	Inserts    *InsertsAPI `bot:"inserts"`
	Updates    *UpdatesAPI `bot:"updates"`
	Deletes    *DeletesAPI `bot:"deletes"`
	op         *adapt.SaveOp
	session    *sess.Session
	connection adapt.Connection
}

func NewAfterSaveAPI(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) *AfterSaveAPI {
	return &AfterSaveAPI{
		Inserts: &InsertsAPI{
			op: request,
		},
		Updates: &UpdatesAPI{
			op: request,
		},
		Deletes: &DeletesAPI{
			op: request,
		},
		session:    session,
		op:         request,
		connection: connection,
	}
}

func (as *AfterSaveAPI) AddError(message string) {
	as.op.AddError(adapt.NewSaveError("", "", message))
}

func (as *AfterSaveAPI) Save(collection string, changes adapt.Collection) error {
	requests := []SaveRequest{
		{
			Collection: collection,
			Wire:       "apiaftersave",
			Changes:    &changes,
		},
	}
	err := SaveWithOptions(requests, as.session, GetConnectionSaveOptions(as.connection))
	return HandleSaveRequestErrors(requests, err)
}

package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/notify"
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
	requests := []datasource.SaveRequest{
		{
			Collection: collection,
			Wire:       "apiaftersave",
			Changes:    &changes,
		},
	}
	err := datasource.SaveWithOptions(requests, as.session, datasource.GetConnectionSaveOptions(as.connection))
	return datasource.HandleSaveRequestErrors(requests, err)
}

func (as *AfterSaveAPI) Notify(source, subject, body, target string) error {
	adapter, err := notify.GetNotificationConnection(source, as.session)
	if err != nil {
		return err
	}

	return adapter.Send(subject, body, target)

}

func (bs *AfterSaveAPI) Load(request BotLoadOp) (*adapt.Collection, error) {

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

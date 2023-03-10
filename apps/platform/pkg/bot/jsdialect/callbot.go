package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/notify"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type CallBotAPI struct {
	Session    *sess.Session
	Params     *ParamsAPI `bot:"params"`
	Connection adapt.Connection
	Results    map[string]interface{}
}

func (cba *CallBotAPI) AddResult(key string, value interface{}) {
	cba.Results[key] = value
}

func (cba *CallBotAPI) Save(collection string, changes adapt.Collection) error {
	requests := []datasource.SaveRequest{
		{
			Collection: collection,
			Wire:       "apicallbot",
			Changes:    &changes,
		},
	}
	err := datasource.Save(requests, cba.Session)
	return datasource.HandleSaveRequestErrors(requests, err)
}

func (bs *CallBotAPI) Load(request BotLoadOp) (*adapt.Collection, error) {

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

	_, err := datasource.Load([]*adapt.LoadOp{op}, bs.Session, nil)
	if err != nil {
		return nil, err
	}

	return collection, nil

}

func (bs *CallBotAPI) SendMessage(subject, body, from, to string) error {
	adapter, err := notify.GetNotificationConnection(bs.Session)
	if err != nil {
		return err
	}

	return adapter.SendMessage(subject, body, from, to)
}

func (bs *CallBotAPI) SendEmail(subject, body, from string, to, cc, bcc []string) error {
	adapter, err := notify.GetNotificationConnection(bs.Session)
	if err != nil {
		return err
	}

	return adapter.SendEmail(subject, body, from, to, cc, bcc)
}

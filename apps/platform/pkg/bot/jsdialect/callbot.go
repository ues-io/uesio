package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type CallBotAPI struct {
	session    *sess.Session
	Params     *ParamsAPI `bot:"params"`
	connection adapt.Connection
	results    map[string]interface{}
}

func (cba *CallBotAPI) AddResult(key string, value interface{}) {
	cba.results[key] = value
}

func (cba *CallBotAPI) Save(collection string, changes adapt.Collection) error {
	requests := []datasource.SaveRequest{
		{
			Collection: collection,
			Wire:       "apicallbot",
			Changes:    &changes,
		},
	}
	err := datasource.Save(requests, cba.session)
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
	}

	err := loadData(op, bs.session, nil)
	if err != nil {
		return nil, err
	}

	return collection, nil

}

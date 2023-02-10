package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type CallBotAPI struct {
	Session    *sess.Session          `bot:"session"`
	Params     *ParamsAPI             `bot:"params"`
	Connection adapt.Connection       `bot:"connection"`
	Results    map[string]interface{} `bot:"Results"`
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
	}

	err := loadData(op, bs.Session, nil)
	if err != nil {
		return nil, err
	}

	return collection, nil

}

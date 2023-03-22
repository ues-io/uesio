package jsdialect

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/integ"
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

func (bs *CallBotAPI) RunIntegrationAction(integrationID string, action string, options interface{}) error {

	integration, err := integ.GetIntegration(integrationID, bs.Session)
	if err != nil {
		fmt.Printf("runnig integration error %v", err)
		return nil
	}

	return integration.RunAction(action, options)

}

func (bs *CallBotAPI) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValueFromKey(configValueKey, bs.Session)
}

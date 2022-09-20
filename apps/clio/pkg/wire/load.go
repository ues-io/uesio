package wire

import (
	"errors"

	"github.com/thecloudmasters/clio/pkg/call"
	"github.com/thecloudmasters/clio/pkg/config"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

type LoadRequest struct {
	CollectionName string                       `json:"collection"`
	Fields         []adapt.LoadRequestField     `json:"fields"`
	Conditions     []adapt.LoadRequestCondition `json:"conditions"`
	Query          bool                         `json:"query"`
	WireName       string                       `json:"name"`
	View           string                       `json:"view"`
}

type LoadReqBatch struct {
	Wires []LoadRequest `json:"wires"`
}

type LoadResponse struct {
	Data adapt.Collection `json:"data"`
}

type LoadResBatch struct {
	Wires []LoadResponse `json:"wires"`
}

func LoadOne(collectionName string, fields []adapt.LoadRequestField, conditions []adapt.LoadRequestCondition) (*adapt.Item, error) {
	result, err := Load(collectionName, fields, conditions)
	if err != nil {
		return nil, err
	}
	if len(result) != 1 {
		return nil, errors.New("Invalid number of records returned from LoadOne")
	}
	return result[0], nil
}

func Load(collectionName string, fields []adapt.LoadRequestField, conditions []adapt.LoadRequestCondition) (adapt.Collection, error) {

	payload := &LoadReqBatch{
		Wires: []LoadRequest{
			{
				CollectionName: collectionName,
				Conditions:     conditions,
				Fields:         fields,
				WireName:       "cliowire",
				View:           "clioview",
				Query:          true,
			},
		},
	}

	sessid, err := config.GetSessionID()
	if err != nil {
		return nil, err
	}

	loadResponse := &LoadResBatch{}

	err = call.PostJSON("site/wires/load", sessid, payload, loadResponse)
	if err != nil {
		return nil, err
	}

	if len(loadResponse.Wires) != 1 {
		return nil, errors.New("Wrong number of responses returned")
	}

	return loadResponse.Wires[0].Data, nil
}

package wire

import (
	"errors"

	"github.com/thecloudmasters/cli/pkg/call"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

type LoadOptions struct {
	Conditions         []adapt.LoadRequestCondition `json:"conditions,omitempty"`
	Fields             []adapt.LoadRequestField     `json:"fields,omitempty"`
	Orders             []adapt.LoadRequestOrder     `json:"order,omitempty"`
	Params             map[string]string            `json:"params,omitempty"`
	RequireWriteAccess bool                         `json:"requirewriteaccess"`
}

type LoadRequest struct {
	CollectionName string `json:"collection"`
	LoadOptions
	Query    bool   `json:"query"`
	WireName string `json:"name"`
	View     string `json:"view"`
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

const ERROR_TOO_MANY_RECORDS_FOR_LOAD_ONE = "Too many records returned from LoadOne"
const ERROR_ZERO_RECORDS_FOR_LOAD_ONE = "Zero records returned from LoadOne"

func LoadOne(collectionName string, options *LoadOptions) (*adapt.Item, error) {
	result, err := Load(collectionName, options)
	if err != nil {
		return nil, err
	}
	if len(result) == 0 {
		return nil, errors.New(ERROR_ZERO_RECORDS_FOR_LOAD_ONE)
	}
	if len(result) != 1 {
		return nil, errors.New(ERROR_TOO_MANY_RECORDS_FOR_LOAD_ONE)
	}
	return result[0], nil
}

func Load(collectionName string, options *LoadOptions) (adapt.Collection, error) {

	payload := &LoadReqBatch{
		Wires: []LoadRequest{
			{
				CollectionName: collectionName,
				LoadOptions:    *options,
				WireName:       "cliwire",
				View:           "cliview",
				Query:          true,
			},
		},
	}

	sessid, err := config.GetSessionID()
	if err != nil {
		return nil, err
	}

	loadResponse := &LoadResBatch{}

	err = call.PostJSON("site/wires/load", sessid, payload, loadResponse, nil)
	if err != nil {
		return nil, err
	}

	if len(loadResponse.Wires) != 1 {
		return nil, errors.New("Wrong number of responses returned")
	}

	return loadResponse.Wires[0].Data, nil
}

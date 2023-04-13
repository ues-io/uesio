package wire

import (
	"errors"

	"github.com/teris-io/shortid"
	"github.com/thecloudmasters/cli/pkg/call"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

type SaveRequest struct {
	Collection string                            `json:"collection"`
	Changes    map[string]map[string]interface{} `json:"changes"`
	Wire       string                            `json:"wire"`
	Errors     []adapt.SaveError                 `json:"errors"`
}

type SaveReqBatch struct {
	Wires []SaveRequest `json:"wires"`
}

func Save(collectionName string, changes []map[string]interface{}) ([]map[string]interface{}, error) {

	changeMap := map[string]map[string]interface{}{}

	for _, change := range changes {
		tempid, _ := shortid.Generate()
		changeMap[tempid] = change
	}

	payload := &SaveReqBatch{
		Wires: []SaveRequest{
			{
				Collection: collectionName,
				Changes:    changeMap,
				Wire:       "cliwire",
			},
		},
	}

	sessid, err := config.GetSessionID()
	if err != nil {
		return nil, err
	}

	saveResponse := &SaveReqBatch{}

	err = call.PostJSON("site/wires/save", sessid, payload, saveResponse)
	if err != nil {
		return nil, err
	}

	if len(saveResponse.Wires) != 1 {
		return nil, errors.New("Wrong number of responses returned")
	}

	singleResponse := saveResponse.Wires[0]

	if len(singleResponse.Errors) > 0 {
		return nil, errors.New("Error saving record")
	}

	results := []map[string]interface{}{}

	for _, result := range singleResponse.Changes {
		results = append(results, result)
	}

	return results, nil

}

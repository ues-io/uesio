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
	Options    SaveOptions                       `json:"options"`
}

type SaveReqBatch struct {
	Wires []SaveRequest `json:"wires"`
}

type SaveOptions struct {
	Upsert bool
}

func Upsert(collectionName string, changes []map[string]interface{}) ([]map[string]interface{}, error) {
	return Save(collectionName, changes, SaveOptions{
		Upsert: true,
	})
}

func Insert(collectionName string, changes []map[string]interface{}) ([]map[string]interface{}, error) {
	return Save(collectionName, changes, SaveOptions{
		Upsert: false,
	})
}

func Save(collectionName string, changes []map[string]interface{}, saveOptions SaveOptions) ([]map[string]interface{}, error) {

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
				Options:    saveOptions,
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
		errString := ""
		for i, saveErr := range singleResponse.Errors {
			if i != 0 {
				errString = errString + ", "
			}
			errString = errString + saveErr.Error()
		}
		return nil, errors.New("Error saving record: " + errString)
	}

	results := []map[string]interface{}{}

	for _, result := range singleResponse.Changes {
		results = append(results, result)
	}

	return results, nil

}

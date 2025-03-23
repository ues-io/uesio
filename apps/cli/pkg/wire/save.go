package wire

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/teris-io/shortid"

	"github.com/thecloudmasters/cli/pkg/call"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/cli/pkg/context"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

type SaveRequest struct {
	Collection string                            `json:"collection"`
	Changes    map[string]map[string]interface{} `json:"changes"`
	Wire       string                            `json:"wire"`
	Errors     []exceptions.SaveException        `json:"errors"`
	Options    SaveOptions                       `json:"options"`
	Params     map[string]string                 `json:"params"`
}

type SaveReqBatch struct {
	Wires []SaveRequest `json:"wires"`
}

type SaveOptions struct {
	Upsert bool
}

func Upsert(collectionName string, changes []map[string]interface{}, appContext *context.AppContext) ([]map[string]interface{}, error) {
	return Save(collectionName, changes, SaveOptions{
		Upsert: true,
	}, appContext)
}

func Insert(collectionName string, changes []map[string]interface{}, appContext *context.AppContext) ([]map[string]interface{}, error) {
	return Save(collectionName, changes, SaveOptions{
		Upsert: false,
	}, appContext)
}

func DeleteOne(collectionName, idField, idValue string, appContext *context.AppContext) error {
	sessionId, err := config.GetSessionID()
	if err != nil {
		return err
	}
	deleteUri := fmt.Sprintf("site/api/v1/collection/%s?%s=eq.%s", strings.ReplaceAll(collectionName, ".", "/"), idField, idValue)
	statusCode, err := call.Delete(deleteUri, sessionId, appContext)
	if err != nil {
		return err
	}
	switch statusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusNotFound:
		return fmt.Errorf("the requested resource %s does not exist", idValue)
	default:
		return fmt.Errorf("unexpected status code: %d", statusCode)
	}
}

func Save(collectionName string, changes []map[string]interface{}, saveOptions SaveOptions, appContext *context.AppContext) ([]map[string]interface{}, error) {

	changeMap := map[string]map[string]interface{}{}

	for _, change := range changes {
		tempId, _ := shortid.Generate()
		changeMap[tempId] = change
	}
	var contextParams map[string]string
	if appContext != nil {
		contextParams = appContext.GetParamsObject()
	}

	payload := &SaveReqBatch{
		Wires: []SaveRequest{
			{
				Collection: collectionName,
				Changes:    changeMap,
				Wire:       "cliwire",
				Options:    saveOptions,
				Params:     contextParams,
			},
		},
	}

	sessionId, err := config.GetSessionID()
	if err != nil {
		return nil, err
	}

	saveResponse := &SaveReqBatch{}

	err = call.PostJSON("site/wires/save", sessionId, payload, saveResponse, appContext)
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

package controller

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

// getParamsFromRequestBody parses a request body, which may be either JSON/form data,
// into a map[string]interface{}, using the Content Type header
func getParamsFromRequestBody(r *http.Request) (map[string]interface{}, error) {

	var params map[string]interface{}

	// Currently we accept params only as form data or JSON
	contentType := r.Header.Get(contentTypeHeader)

	if strings.Contains(contentType, "application/x-www-form-urlencoded") {
		// ParseForm must be called in order for r.Form to contain any parsed form data variables
		if err := r.ParseForm(); err != nil {
			msg := "Unable to parse form data: " + err.Error()
			return nil, exceptions.NewBadRequestException(msg)
		}
		params = map[string]interface{}{}
		for param, values := range r.Form {
			params[param] = values[0]
		}
	} else {
		err := json.NewDecoder(r.Body).Decode(&params)
		if err != nil {
			msg := "Invalid request format: " + err.Error()
			return nil, exceptions.NewBadRequestException(msg)
		}
	}
	return params, nil
}

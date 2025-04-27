package controller

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

// getParamsFromRequestBody parses a request body, which may be either JSON/form data,
// into a map[string]interface{}, using the Content Type header
func getParamsFromRequestBody(r *http.Request) (map[string]any, error) {

	var params map[string]any

	// Currently we accept params only as form data or JSON
	contentType := r.Header.Get(contentTypeHeader)

	if strings.Contains(contentType, "application/x-www-form-urlencoded") {
		// ParseForm must be called in order for r.Form to contain any parsed form data variables
		if err := r.ParseForm(); err != nil {
			return nil, exceptions.NewBadRequestException("unable to parse form data", err)
		}
		params = map[string]any{}
		for param, values := range r.Form {
			params[param] = values[0]
		}
	} else {
		err := json.NewDecoder(r.Body).Decode(&params)
		if err != nil {
			return nil, exceptions.NewBadRequestException("invalid request format", err)
		}
	}
	return params, nil
}

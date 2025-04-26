package jsdialect

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"github.com/stripe/stripe-go/form"
	httpClient "github.com/thecloudmasters/uesio/pkg/http"
	"github.com/thecloudmasters/uesio/pkg/meta"
	oauthlib "github.com/thecloudmasters/uesio/pkg/oauth2"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type BotHttpAPI struct {
	ic *wire.IntegrationConnection
}

func (api *BotHttpAPI) GetIntegration() *meta.Integration {
	return api.ic.GetIntegration()
}

func NewBotHttpAPI(integrationConnection *wire.IntegrationConnection) *BotHttpAPI {
	return &BotHttpAPI{
		ic: integrationConnection,
	}
}

type BotHttpAuth struct {
	Type        string            `json:"type"`
	Credentials *wire.Credentials `json:"credentials"`
}

func NewBotHttpAuth(connection *wire.IntegrationConnection) *BotHttpAuth {
	authType := "NONE"
	var credentials *wire.Credentials
	if connection != nil {
		if connection.GetIntegration() != nil {
			authType = connection.GetIntegration().Authentication
		}
		credentials = connection.GetCredentials()
	}
	return &BotHttpAuth{
		Type:        authType,
		Credentials: credentials,
	}
}

type BotHttpRequest struct {
	Headers      map[string]string `json:"headers" bot:"headers"`
	Method       string            `json:"method" bot:"method"`
	URL          string            `json:"url" bot:"url"`
	Body         any               `json:"body" bot:"body"`
	Auth         *BotHttpAuth      `json:"auth" bot:"auth"`
	ResponseBody any               `json:"-"`
}

func (req *BotHttpRequest) getLowerCaseHeaderMap() map[string]string {
	lowercase := make(map[string]string, len(req.Headers))
	for k, v := range req.Headers {
		lowercase[strings.ToLower(k)] = v
	}
	return lowercase
}

func (req *BotHttpRequest) getHeader(header string) string {
	return req.getLowerCaseHeaderMap()[strings.ToLower(header)]
}

func (req *BotHttpRequest) getContentType() string {
	return req.getHeader("content-type")
}

type BotHttpResponse struct {
	Headers map[string]string `json:"headers" bot:"headers"`
	Code    int               `json:"code" bot:"code"`
	Status  string            `json:"status" bot:"status"`
	Body    any               `json:"body" bot:"body"`
}

func Unauthorized(message string) *BotHttpResponse {
	statusText := http.StatusText(http.StatusUnauthorized)
	return &BotHttpResponse{
		Code:    http.StatusUnauthorized,
		Status:  statusText,
		Headers: map[string]string{},
		Body: map[string]string{
			"error":  message,
			"status": statusText,
		},
	}
}

func BadRequest(message string) *BotHttpResponse {
	statusText := http.StatusText(http.StatusBadRequest)
	return &BotHttpResponse{
		Code:    http.StatusBadRequest,
		Status:  statusText,
		Headers: map[string]string{},
		Body: map[string]string{
			"error":  message,
			"status": statusText,
		},
	}
}

func ServerError(err error) *BotHttpResponse {
	slog.Error(err.Error())
	statusText := http.StatusText(http.StatusInternalServerError)
	return &BotHttpResponse{
		Code:    http.StatusInternalServerError,
		Status:  statusText,
		Headers: map[string]string{},
		Body: map[string]string{
			"status": statusText,
		},
	}
}

func (api *BotHttpAPI) Request(req *BotHttpRequest) *BotHttpResponse {

	if req.URL == "" {
		return BadRequest("no url provided")
	}
	useMethod := strings.ToUpper(req.Method)
	if useMethod != http.MethodGet && useMethod != http.MethodPost && useMethod != http.MethodPut && useMethod != http.MethodDelete && useMethod != http.MethodPatch {
		return BadRequest("invalid HTTP request method: " + req.Method)
	}

	var payloadReader io.Reader
	if req.Body != nil {
		switch payload := req.Body.(type) {
		case string:
			payloadReader = strings.NewReader(payload)
		case []byte:
			payloadReader = bytes.NewReader(payload)
		case map[string]any, []any, wire.LoadRequestBatch:

			if strings.Contains(req.getContentType(), "x-www-form-urlencoded") {
				qs := &form.Values{}
				form.AppendTo(qs, payload)
				payloadReader = strings.NewReader(qs.ToValues().Encode())
			} else {
				// Marshall other payloads, e.g. map[string]interface{} (almost certainly coming from Uesio) to JSON
				jsonBytes, err := json.Marshal(payload)
				if err != nil {
					return BadRequest("unable to serialize payload into JSON")
				}
				payloadReader = bytes.NewReader(jsonBytes)
			}

		}
		if payloadReader == nil {
			return BadRequest("unexpected payload format for " + req.Method + " request")
		}
	}

	httpReq, err := http.NewRequest(useMethod, req.URL, payloadReader)
	if err != nil {
		return ServerError(err)
	}
	if len(req.Headers) > 0 {
		for header, value := range req.Headers {
			httpReq.Header.Set(header, value)
		}
	}

	// Perform the request using the selected authentication paradigm
	httpResp, err := api.makeRequest(httpReq, NewBotHttpAuth(api.ic))
	if err != nil {
		if exceptions.IsType[*exceptions.UnauthorizedException](err) {
			return Unauthorized(err.Error())
		}
		return ServerError(err)
	}

	defer httpResp.Body.Close()

	// Read the full body into a byte array, so we can cache / parse
	responseData, responseError := io.ReadAll(httpResp.Body)
	if responseError != nil {
		return ServerError(fmt.Errorf("unable to read response body: %w", responseError))
	}

	contentType := httpResp.Header.Get("Content-Type")

	// Attempt to parse the response body into a structured representation,
	// if possible. If it fails, just return the raw response as a string
	parsedBody, err := ParseResponseBody(contentType, responseData, req.ResponseBody)
	if err != nil {
		return &BotHttpResponse{
			Headers: getBotHeaders(httpResp.Header),
			Code:    httpResp.StatusCode,
			Status:  httpResp.Status,
			Body:    string(responseData),
		}
	}
	return &BotHttpResponse{
		Headers: getBotHeaders(httpResp.Header),
		Code:    httpResp.StatusCode,
		Status:  httpResp.Status,
		Body:    parsedBody,
	}
}

// makeRequest performs any authentication needed for the request, mutating it as necessary,
// and then performs the request.
func (api *BotHttpAPI) makeRequest(req *http.Request, auth *BotHttpAuth) (*http.Response, error) {
	switch auth.Type {
	case "API_KEY":
		if err := api.setApiKeyInRequest(req, auth.Credentials); err != nil {
			return nil, err
		}
	case "BASIC_AUTH":
		if err := api.setBasicAuthHeaderInRequest(req, auth.Credentials); err != nil {
			return nil, err
		}
	case "OAUTH2_AUTHORIZATION_CODE", "OAUTH2_CLIENT_CREDENTIALS":
		return oauthlib.MakeRequestWithStoredUserCredentials(req, api.ic)
	}
	// Default
	return httpClient.Get().Do(req)
}

func (api *BotHttpAPI) setBasicAuthHeaderInRequest(req *http.Request, cred *wire.Credentials) error {
	username, err := cred.GetRequiredEntry("username")
	if err != nil {
		return exceptions.NewUnauthorizedException("username is required")
	}
	password, err := cred.GetRequiredEntry("password")
	if err != nil {
		return exceptions.NewUnauthorizedException("password is required")
	}
	req.Header.Set("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(username+":"+password)))
	return nil
}

func (api *BotHttpAPI) setApiKeyInRequest(req *http.Request, cred *wire.Credentials) error {
	_, err := cred.GetRequiredEntry("apikey")
	if err != nil {
		return exceptions.NewUnauthorizedException("apikey is required")
	}
	location, err := cred.GetRequiredEntry("location")
	if err != nil {
		return exceptions.NewUnauthorizedException("location is required")
	}
	locationName, err := cred.GetRequiredEntry("locationName")
	if err != nil {
		return exceptions.NewUnauthorizedException("locationName is required")
	}
	templateString := cred.GetEntry("locationValue", "${apikey}")

	locationTemplate, err := templating.NewWithFunc(templateString, func(m map[string]any, key string) (any, error) {
		return cred.GetRequiredEntry(key)
	})
	if err != nil {
		return exceptions.NewUnauthorizedException("invalid API Key credentials, invalid location template: " + err.Error())
	}
	locationValue, err := templating.Execute(locationTemplate, nil)
	if err != nil {
		return exceptions.NewUnauthorizedException("invalid API Key credentials, location template could not be merged: " + err.Error())
	}

	switch location {
	case "header":
		req.Header.Set(locationName, locationValue)
		return nil
	case "querystring":
		query := req.URL.Query()
		query.Set(locationName, locationValue)
		req.URL.RawQuery = query.Encode()
		return nil
	}
	return exceptions.NewUnauthorizedException("invalid API Key credentials, location is invalid")
}

func getBotHeaders(header http.Header) map[string]string {
	headers := map[string]string{}
	for k := range header {
		headers[k] = header.Get(k)
	}
	return headers
}

// ParseResponseBody has two returns: one if responseBody is not nil, to be used by GO
// and the other one if it is to be used by TS/JS the first returned argument
func ParseResponseBody(contentType string, rawBody []byte, responseBody any) (any, error) {

	// responseBody may be a non-nil struct so that we can deserialize directly into specific structs.
	if responseBody != nil {
		err := json.NewDecoder(bytes.NewReader(rawBody)).Decode(responseBody)
		if err != nil {
			return nil, err
		}
		return responseBody, nil
	}

	if strings.Contains(contentType, "/json") {
		// If it starts with a curly brace, treat it as JSON object
		if string(rawBody[0]) == "{" {
			responseBody = &map[string]any{}
		} else {
			// Otherwise, assume it's a JSON array
			responseBody = &[]any{}
		}
		err := json.NewDecoder(bytes.NewReader(rawBody)).Decode(responseBody)
		if err != nil {
			return nil, err
		}
	} else {
		responseBody = string(rawBody)
	}

	return responseBody, nil

}

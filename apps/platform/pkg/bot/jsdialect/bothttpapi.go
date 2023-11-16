package jsdialect

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	httpClient "github.com/thecloudmasters/uesio/pkg/http"
	"github.com/thecloudmasters/uesio/pkg/integ/web"
	"github.com/thecloudmasters/uesio/pkg/meta"
	oauthlib "github.com/thecloudmasters/uesio/pkg/oauth2"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

type BotHttpAPI struct {
	bot *meta.Bot
	ic  *adapt.IntegrationConnection
}

func (api *BotHttpAPI) getSession() *sess.Session {
	return api.ic.GetSession()
}

func (api *BotHttpAPI) GetIntegration() *meta.Integration {
	return api.ic.GetIntegration()
}

func NewBotHttpAPI(bot *meta.Bot, integrationConnection *adapt.IntegrationConnection) *BotHttpAPI {
	return &BotHttpAPI{
		bot: bot,
		ic:  integrationConnection,
	}
}

type BotHttpAuth struct {
	Type        string             `json:"type"`
	Credentials *adapt.Credentials `json:"credentials"`
}

func NewBotHttpAuth(connection *adapt.IntegrationConnection) *BotHttpAuth {
	authType := "NONE"
	var credentials *adapt.Credentials
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
	Headers map[string]string `json:"headers" bot:"headers"`
	Method  string            `json:"method" bot:"method"`
	URL     string            `json:"url" bot:"url"`
	Body    interface{}       `json:"body" bot:"body"`
	Auth    *BotHttpAuth      `json:"auth" bot:"auth"`
}

type BotHttpResponse struct {
	Headers map[string]string `json:"headers" bot:"headers"`
	Code    int               `json:"code" bot:"code"`
	Status  string            `json:"status" bot:"status"`
	Body    interface{}       `json:"body" bot:"body"`
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
		case map[string]interface{}, []interface{}:
			// Marshall other payloads, e.g. map[string]interface{} (almost certainly coming from Uesio) to JSON
			jsonBytes, err := json.Marshal(payload)
			if err != nil {
				return BadRequest("unable to serialize payload into JSON")
			}
			payloadReader = bytes.NewReader(jsonBytes)
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
		switch err.(type) {
		case *exceptions.UnauthorizedException:
			return Unauthorized(err.Error())
		default:
			return ServerError(err)
		}
	}

	defer httpResp.Body.Close()

	// Read the full body into a byte array, so we can cache / parse
	responseData, responseError := io.ReadAll(httpResp.Body)
	if responseError != nil {
		return ServerError(errors.New("unable to read response body: " + responseError.Error()))
	}

	contentType := httpResp.Header.Get("Content-Type")

	// Attempt to parse the response body into a structured representation,
	// if possible. If it fails, just return the raw response as a string
	parsedBody, err := web.ParseResponseBody(contentType, responseData, nil)
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
		break
	case "BASIC_AUTH":
		if err := api.setBasicAuthHeaderInRequest(req, auth.Credentials); err != nil {
			return nil, err
		}
		break
	case "OAUTH2_AUTHORIZATION_CODE", "OAUTH2_CLIENT_CREDENTIALS":
		return oauthlib.MakeRequestWithStoredUserCredentials(req, api.ic.GetIntegration(), api.getSession(), auth.Credentials)
		break
	}
	// Default
	return httpClient.Get().Do(req)
}

func (api *BotHttpAPI) setBasicAuthHeaderInRequest(req *http.Request, cred *adapt.Credentials) error {
	username, err := cred.GetRequiredEntry("username")
	if err != nil {
		return exceptions.NewUnauthorizedException("username is required")
	}
	password, err := cred.GetRequiredEntry("password")
	if err != nil {
		return exceptions.NewUnauthorizedException("password is required")
	}
	buf := bytes.NewBuffer([]byte{})
	_, err = base64.NewEncoder(base64.StdEncoding, buf).Write([]byte(username + ":" + password))
	if err != nil {
		return exceptions.NewUnauthorizedException("invalid username and password provided for integration")
	}
	req.Header.Set("Authorization", "Basic "+buf.String())
	return nil
}

func (api *BotHttpAPI) setApiKeyInRequest(req *http.Request, cred *adapt.Credentials) error {
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

	locationTemplate, err := templating.NewWithFunc(templateString, func(m map[string]interface{}, key string) (interface{}, error) {
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
		req.Header.Set(http.CanonicalHeaderKey(locationName), locationValue)
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

package jsdialect

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"golang.org/x/oauth2"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	httpClient "github.com/thecloudmasters/uesio/pkg/http"
	"github.com/thecloudmasters/uesio/pkg/integ/web"
	"github.com/thecloudmasters/uesio/pkg/meta"
	oauthlib "github.com/thecloudmasters/uesio/pkg/oauth2"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type BotHttpAPI struct {
	bot         *meta.Bot
	session     *sess.Session
	integration adapt.IntegrationConnection
}

func NewBotHttpAPI(bot *meta.Bot, session *sess.Session, integration adapt.IntegrationConnection) *BotHttpAPI {
	return &BotHttpAPI{
		bot:         bot,
		session:     session,
		integration: integration,
	}
}

type BotHttpAuth struct {
	Type        string             `json:"type"`
	Credentials *adapt.Credentials `json:"credentials"`
}

func NewBotHttpAuth(connection adapt.IntegrationConnection) *BotHttpAuth {
	return &BotHttpAuth{
		Type:        connection.GetIntegration().Authentication,
		Credentials: connection.GetCredentials(),
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
		case map[string]interface{}:
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

	// Apply authentication
	client, err := api.authenticateRequest(httpReq, NewBotHttpAuth(api.integration))
	if err != nil {
		switch err.(type) {
		case *UnauthorizedException:
			return Unauthorized(err.Error())
		default:
			return ServerError(err)
		}
	}

	httpResp, err := client.Do(httpReq)
	if err != nil {
		return ServerError(err)
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

// authenticateRequest performs any authentication needed for the request, mutating it as necessary,
// and returns an HTTP client which can be ued for perform the request
func (api *BotHttpAPI) authenticateRequest(req *http.Request, auth *BotHttpAuth) (*http.Client, error) {
	client := httpClient.Get()
	switch auth.Type {
	case "API_KEY":
		// TODO: Determine where to put the key (header, query param, etc.)
		// and apply this to the request
		break
	case "OAUTH2_AUTHORIZATION_CODE":
		return api.getOAuth2AuthorizationCodeClient(req, auth)
	case "OAUTH2_CLIENT_CREDENTIALS":
		// TODO: Check for an integration credential record for the "system" user for the tenant,
		// and if one exists and is unexpired, use this token directly,
		// otherwise hit the access token endpoint to get a fresh token

		break
	}
	return client, nil
}

type UnauthorizedException struct {
	msg string
}

func NewUnauthorizedException(msg string) *UnauthorizedException {
	return &UnauthorizedException{msg}
}
func (e *UnauthorizedException) Error() string {
	return e.msg
}

func (api *BotHttpAPI) getOAuth2AuthorizationCodeClient(req *http.Request, auth *BotHttpAuth) (*http.Client, error) {
	ctx := context.Background()

	config, err := oauthlib.GetConfig(auth.Credentials, api.session.GetContextSite().GetHost())
	if err != nil {
		return nil, NewUnauthorizedException(err.Error())
	}

	// Fetch OAuth credentials from the DB Integration Collection record
	// TODO: use existing metadata cache... or connection...
	connection, err := datasource.GetPlatformConnection(nil, api.session, nil)
	if err != nil {
		return nil, errors.New("unable to obtain platform connection")
	}
	coreSession, err := datasource.EnterVersionContext("uesio/core", api.session, connection)
	if err != nil {
		return nil, errors.New("failed to enter uesio/core context: " + err.Error())
	}

	integrationCredential, err := oauthlib.GetIntegrationCredential(
		api.session.GetSiteUser().ID, api.integration.GetIntegration().GetKey(), coreSession, connection)
	if err != nil {
		return nil, errors.New("unable to retrieve integration credential: " + err.Error())
	}
	// If we do NOT have an existing record, then we cannot authenticate
	if integrationCredential == nil {
		return nil, NewUnauthorizedException("user has not yet authorized this integration")
	}
	accessToken, _ := integrationCredential.GetFieldAsString(oauthlib.AccessTokenField)
	refreshToken, _ := integrationCredential.GetFieldAsString(oauthlib.RefreshTokenField)
	accessTokenExpiry, _ := integrationCredential.GetField(oauthlib.AccessTokenExpirationField)
	var expiry time.Time
	if accessTokenExpiry != nil {
		if int64Value, isValid := accessTokenExpiry.(int64); isValid {
			expiry = time.Unix(int64Value, 0)
		}
	}
	tok := &oauth2.Token{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		Expiry:       expiry,
	}
	return config.Client(ctx, tok), nil
}

func getBotHeaders(header http.Header) map[string]string {
	headers := map[string]string{}
	for k := range header {
		headers[k] = header.Get(k)
	}
	return headers
}

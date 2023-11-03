package jsdialect

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/url"
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

	// Perform the request using the selected authentication paradigm
	httpResp, err := api.makeRequest(httpReq, NewBotHttpAuth(api.integration))
	if err != nil {
		switch err.(type) {
		case *UnauthorizedException:
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
		// TODO: Determine where to put the key (header, query param, etc.)
		// and apply this to the request
		break
	case "BASIC_AUTH":
		if err := api.setBasicAuthHeaderInRequest(req, auth.Credentials); err != nil {
			return nil, err
		}
		break
	case "OAUTH2_AUTHORIZATION_CODE":
		return api.makeRequestWithOAuth2AuthorizationCode(req, auth)
	case "OAUTH2_CLIENT_CREDENTIALS":
		// TODO: Check for an integration credential record for the "system" user for the tenant,
		// and if one exists and is unexpired, use this token directly,
		// otherwise hit the access token endpoint to get a fresh token
		break
	}
	// Default
	return httpClient.Get().Do(req)
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

func (api *BotHttpAPI) makeRequestWithOAuth2AuthorizationCode(req *http.Request, auth *BotHttpAuth) (*http.Response, error) {
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
		if typedVal, isValid := accessTokenExpiry.(float64); isValid {
			expiry = time.Unix(int64(typedVal), 0)
		}
	}
	// Quick check -- is the access token expired? If so, we need to get a new one
	if expiry.Before(time.Now()) {
		accessToken = ""
	}

	tok := &oauth2.Token{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		Expiry:       expiry,
	}
	// If we already have an authorization header, add it in
	var originalAuthorizationHeader string
	if accessToken != "" {
		originalAuthorizationHeader = "Bearer " + accessToken
		req.Header.Add("Authorization", originalAuthorizationHeader)
	}
	httpResp, err := config.Client(ctx, tok).Do(req)

	// If the status code is unauthorized, then we need to get a new access token.
	// Retry the request without the access token, just once.
	// This shouldn't happen if the access token expiration is reliable,
	// but that's not the case for many OAuth implementations
	if err == nil && httpResp != nil && httpResp.StatusCode == http.StatusUnauthorized {
		tok.AccessToken = ""
		tok.Expiry = time.Now().Add(-1 * time.Hour)
		httpResp, err = config.Client(ctx, tok).Do(req)
	}

	if err == nil {
		// See if a new authorization token was generated by the exchange. If so, save this so that subsequent requests use it
		newAuthHeader := httpResp.Request.Header.Get("Authorization")
		if newAuthHeader != originalAuthorizationHeader && strings.HasPrefix(newAuthHeader, "Bearer ") {
			newVal, _ := strings.CutPrefix(newAuthHeader, "Bearer ")
			newVal = strings.TrimSpace(newVal)
			if newVal != accessToken {
				slog.Info("GOT new AccessToken, SAVING to DB...")
				// We don't really have a way of getting back the expiration data, so assume 1 hour...
				integrationCredential.SetField(oauthlib.AccessTokenExpirationField, time.Now().Add(time.Hour).Unix())
				integrationCredential.SetField(oauthlib.AccessTokenField, newVal)
				integrationCredential.SetField(adapt.UPDATED_AT_FIELD, time.Now().Unix())
				if upsertErr := oauthlib.UpsertIntegrationCredential(integrationCredential, coreSession, connection); upsertErr != nil {
					slog.Error("error upserting integration credential: " + upsertErr.Error())
				}
			}
		}
		return httpResp, nil
	}

	// Otherwise, we may need to reauthenticate
	switch typedErr := err.(type) {
	case *url.Error:
		switch innerErr := typedErr.Err.(type) {
		case *oauth2.RetrieveError:
			// This usually means that the refresh token is invalid, expired, or can't be obtained.
			// Delete it, or at least attempt to
			slog.Debug("Refresh token must be invalid/expired, so we are purging it...")
			if deleteErr := oauthlib.DeleteIntegrationCredential(integrationCredential, coreSession, connection); deleteErr != nil {
				slog.Error("unable to delete integration credential record: " + deleteErr.Error())
			}
			return nil, NewUnauthorizedException(innerErr.Error())
		}
	}
	return nil, NewUnauthorizedException("Authentication failed: " + err.Error())
}

func (api *BotHttpAPI) setBasicAuthHeaderInRequest(req *http.Request, cred *adapt.Credentials) error {
	username, err := cred.GetRequiredEntry("username")
	if err != nil {
		return NewUnauthorizedException("username is required")
	}
	password, err := cred.GetRequiredEntry("password")
	if err != nil {
		return NewUnauthorizedException("password is required")
	}
	buf := bytes.NewBuffer([]byte{})
	_, err = base64.NewEncoder(base64.StdEncoding, buf).Write([]byte(username + ":" + password))
	if err != nil {
		return NewUnauthorizedException("invalid username and password provided for integration")
	}
	req.Header.Set("Authorization", "Basic "+buf.String())
	return nil
}

func getBotHeaders(header http.Header) map[string]string {
	headers := map[string]string{}
	for k := range header {
		headers[k] = header.Get(k)
	}
	return headers
}

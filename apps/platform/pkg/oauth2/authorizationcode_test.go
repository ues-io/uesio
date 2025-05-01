package oauth2

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"golang.org/x/oauth2"

	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/tls"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

// TokenEndpointResponse is the struct representing the HTTP response from OAuth2
// providers returning a token or error in JSON form.
// https://datatracker.ietf.org/doc/html/rfc6749#section-5.1
type TokenEndpointResponse struct {
	AccessToken      string `json:"access_token"`
	TokenType        string `json:"token_type"`
	RefreshToken     string `json:"refresh_token,omitempty"`
	ExpiresIn        int32  `json:"expires_in,omitempty"`
	ErrorCode        string `json:"error,omitempty"`
	ErrorDescription string `json:"error_description,omitempty"`
	ErrorURI         string `json:"error_uri,omitempty"`
}

func TestAuthorizationCodeFlow(t *testing.T) {

	host := tls.ServeAppDefaultScheme() + "://studio.ues.io"
	sampleAuthCode := "authcode1234"

	var serveResponseBody string
	var serveStatusCode int
	var testInstance *testing.T
	var requestAsserts func(t *testing.T, request *http.Request)

	integrationName := "luigi/foo.bar"
	session := &sess.Session{}
	session.SetGoContext(context.Background())

	// set up a mock server to handle our test requests
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if requestAsserts != nil && testInstance != nil {
			requestAsserts(testInstance, r)
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(serveStatusCode)
		if serveResponseBody != "" {
			w.Write([]byte(serveResponseBody))
		}
	}))
	defer (func() {
		server.Close()
	})()

	setCacheImpl(cache.NewMemoryCache[string](time.Hour, time.Hour))

	happyCredentials := &wire.Credentials{
		"clientId":     "testclientid",
		"clientSecret": "testclientsecret",
		"scopes":       "scope1,scope2",
		"tokenUrl":     server.URL + "/oauth2/token",
		"authUrl":      server.URL + "/oauth2/authorize",
	}

	redirectUri := tls.ServeAppDefaultScheme() + "://studio.ues.io/site/oauth2/callback"

	conf := &oauth2.Config{
		ClientID:     "testclientid",
		ClientSecret: "testclientsecret",
		Endpoint: oauth2.Endpoint{
			TokenURL: server.URL + "/oauth2/token",
			AuthURL:  server.URL + "/oauth2/authorize",
		},
		RedirectURL: redirectUri,
		Scopes:      []string{"scope1", "scope2"},
	}

	tests := []struct {
		name                  string
		credentials           *wire.Credentials
		wantAccessToken       string
		wantRefreshToken      string
		tokenEndpointResponse *TokenEndpointResponse
		tokenEndpointCode     int
		requestAsserts        func(t *testing.T, request *http.Request)
	}{
		{
			name:        "happy path",
			credentials: happyCredentials,
			tokenEndpointResponse: &TokenEndpointResponse{
				AccessToken:  "test-access-token",
				TokenType:    "bearer",
				RefreshToken: "test-refresh-token",
			},
			wantAccessToken:  "test-access-token",
			wantRefreshToken: "test-refresh-token",
			requestAsserts: func(t *testing.T, request *http.Request) {
				err := request.ParseForm()
				assert.Nil(t, err)
				formData := request.Form
				assert.True(t, formData.Has("code_verifier"))
				assert.Equal(t, formData.Get("code"), sampleAuthCode)
				assert.Equal(t, formData.Get("redirect_uri"), redirectUri)
				assert.Equal(t, formData.Get("grant_type"), "authorization_code")
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			serveResponseBody = ""
			if tt.tokenEndpointResponse != nil {
				serialized, err := json.Marshal(tt.tokenEndpointResponse)
				if err != nil {
					assert.Fail(t, "error serializing token endpoint response to JSON")
				} else {
					serveResponseBody = string(serialized)
				}
			}
			if tt.tokenEndpointCode == 0 {
				serveStatusCode = 200
			} else {
				serveStatusCode = tt.tokenEndpointCode
			}
			requestAsserts = tt.requestAsserts
			testInstance = t
			redirectMeta, err := GetRedirectMetadata(conf, integrationName, session)
			assert.Nil(t, err)
			assert.NotNil(t, redirectMeta)
			parsed, err := url.Parse(redirectMeta.AuthURL)
			assert.Nil(t, err)
			queryVals := parsed.Query()
			assert.True(t, queryVals.Has("code_challenge"))
			assert.Equal(t, "offline", queryVals.Get("access_type"))
			assert.Equal(t, "testclientid", queryVals.Get("client_id"))
			assert.Equal(t, "S256", queryVals.Get("code_challenge_method"))
			assert.Equal(t, redirectUri, queryVals.Get("redirect_uri"))
			assert.Equal(t, "code", queryVals.Get("response_type"))
			assert.Equal(t, redirectMeta.State, queryVals.Get("state"))
			assert.Equal(t, []string{"scope1 scope2"}, queryVals["scope"])
			stateObject, err := UnmarshalState(redirectMeta.State)
			assert.Nil(t, err)
			gotToken, err := ExchangeAuthorizationCodeForAccessToken(session.Context(), tt.credentials, host, sampleAuthCode, stateObject)
			assert.Equal(t, tt.wantAccessToken, gotToken.AccessToken)
			assert.Equal(t, tt.wantRefreshToken, gotToken.RefreshToken)
		})
	}
}

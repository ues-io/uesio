package jsdialect

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sync/atomic"
	"testing"
	"time"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/oauth2"
	"github.com/thecloudmasters/uesio/pkg/types/wire"

	"github.com/stretchr/testify/assert"

	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getIntegrationConnection(authType string, credentials *wire.Credentials) *wire.IntegrationConnection {
	s := (&sess.Session{}).SetSiteSession(sess.NewSiteSession(&meta.Site{
		Name: "prod",
		App: &meta.App{
			BuiltIn:  meta.BuiltIn{UniqueKey: "luigi/foo"},
			FullName: "luigi/foo",
			Name:     "foo",
		},
	}, &meta.User{
		BuiltIn: meta.BuiltIn{ID: "user123"},
	}))
	s.SetGoContext(context.Background())
	return wire.NewIntegrationConnection(
		&meta.Integration{
			BundleableBase: meta.BundleableBase{
				Name:      "someservice",
				Namespace: "luigi/foo",
			},
			Authentication: authType,
		},
		&meta.IntegrationType{},
		s,
		credentials,
		nil)
}

func Test_Request(t *testing.T) {

	var serveResponseBody, serveContentType string
	var serveStatusCode int
	var testInstance *testing.T
	var requestAsserts func(t *testing.T, request *http.Request)
	var countRequests map[string]uint32
	var credentialSaveCalled, credentialFetchCalled bool

	// set up a mock server to handle our test requests
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reqURL := r.URL.String()
		if count, isPresent := countRequests[reqURL]; isPresent {
			atomic.AddUint32(&count, 1)
			countRequests[reqURL] = count
		} else {
			countRequests[reqURL] = 1
		}
		if requestAsserts != nil && testInstance != nil {
			requestAsserts(testInstance, r)
		}
		w.Header().Set("content-type", serveContentType)
		w.WriteHeader(serveStatusCode)
		if serveResponseBody != "" {
			w.Write([]byte(serveResponseBody))
		}
	}))
	defer (func() {
		server.Close()
	})()

	type Address struct {
		Street1       string `json:"street1"`
		Street2       string `json:"street2"`
		City          string `json:"city"`
		ZipPostalCode string `json:"zip"`
		Country       string `json:"country"`
		State         string `json:"state"`
	}

	type User struct {
		First         string   `json:"first"`
		Last          string   `json:"last"`
		FavoriteFoods []string `json:"favoriteFoods"`
	}

	type ResponseArgs struct {
		responseData   interface{}
		requestOptions interface{}
	}

	type ResponseAssertsFunc func(t *testing.T, response *BotHttpResponse)

	var noOpFetch oauth2.CredentialFetcher
	var noOpSave oauth2.CredentialSaver
	var noOpDelete oauth2.CredentialSaver

	noOpFetch = func(ic *wire.IntegrationConnection) (*wire.Item, error) {
		credentialFetchCalled = true
		return nil, nil
	}
	noOpSave = func(item *wire.Item, ic *wire.IntegrationConnection) error {
		credentialSaveCalled = true
		return nil
	}
	noOpDelete = func(item *wire.Item, ic *wire.IntegrationConnection) error {
		return nil
	}

	type args struct {
		integration         *wire.IntegrationConnection
		request             *BotHttpRequest
		response            string
		responseContentType string
		requestAsserts      func(t *testing.T, request *http.Request)
		responseAsserts     ResponseAssertsFunc
		responseStatusCode  int
		makeRequestNTimes   int
		credentialAccessors *oauth2.CredentialAccessors
	}

	tests := []struct {
		name string
		args args
	}{
		{
			"GET: it should handle JSON object responses",
			args{
				request: &BotHttpRequest{
					Method: "GET",
					URL:    server.URL + "/test",
				},
				response:            `{"foo":"bar"}`,
				responseContentType: "application/json",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "GET", request.Method)
					assert.Equal(t, "/test", request.URL.Path)
					assert.EqualValues(t, uint32(1), countRequests[request.URL.String()])
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, "200 OK", response.Status)
					assert.Equal(t, http.StatusOK, response.Code)
					assert.Equal(t, "application/json", response.Headers["Content-Type"])
					if responseMap, ok := response.Body.(*map[string]interface{}); ok {
						assert.Equal(t, "bar", (*responseMap)["foo"])
					} else {
						assert.Fail(t, "response is not a map[string]interface{}")
					}
				},
			},
		},
		{
			"GET: it should handle JSON array responses",
			args{
				request: &BotHttpRequest{
					Method: "GET",
					URL:    server.URL + "/array",
				},
				response:            `[{"foo":"bar"},{"hello":"world"}]`,
				responseContentType: "text/json",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "GET", request.Method)
					assert.Equal(t, "/array", request.URL.Path)
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, "200 OK", response.Status)
					assert.Equal(t, http.StatusOK, response.Code)
					assert.Equal(t, "text/json", response.Headers["Content-Type"])
					if responses, ok := response.Body.(*[]interface{}); ok {
						if item, isMap := (*responses)[1].(map[string]interface{}); isMap {
							assert.Equal(t, "world", item["hello"])
						}
					} else {
						assert.Fail(t, "response is not a valid array")
					}
				},
			},
		},
		{
			"GET: it should return other response types as raw data",
			args{
				request: &BotHttpRequest{
					Method: "GET",
					URL:    server.URL + "/xml",
					Headers: map[string]string{
						"Accept":        "text/xml",
						"Authorization": "my-api-key",
					},
				},
				response:            `<books/>`,
				responseContentType: "text/xml",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "GET", request.Method)
					assert.Equal(t, "/xml", request.URL.Path)
					assert.Equal(t, "text/xml", request.Header.Get("Accept"))
					assert.Equal(t, "my-api-key", request.Header.Get("Authorization"))
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, "200 OK", response.Status)
					assert.Equal(t, http.StatusOK, response.Code)
					assert.Equal(t, "text/xml", response.Headers["Content-Type"])
					assert.Equal(t, `<books/>`, response.Body)
				},
			},
		},
		{
			"POST: it should send a payload to the API",
			args{
				request: &BotHttpRequest{
					Method: "POST",
					URL:    server.URL + "/user/create",
					Body:   `{"first":"Luigi","last":"Vampa"}`,
					Headers: map[string]string{
						"Accept":        "text/plain",
						"Content-Type":  "text/json",
						"Authorization": "api-key",
					},
				},
				response:            `ok`,
				responseContentType: "text/plain",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "POST", request.Method)
					assert.Equal(t, "/user/create", request.URL.Path)
					assert.Equal(t, "text/plain", request.Header.Get("Accept"))
					assert.Equal(t, "api-key", request.Header.Get("Authorization"))
					body, err := io.ReadAll(request.Body)
					assert.Equal(t, nil, err)
					assert.Equal(t, string(body), `{"first":"Luigi","last":"Vampa"}`)
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, "200 OK", response.Status)
					assert.Equal(t, http.StatusOK, response.Code)
					assert.Equal(t, "text/plain", response.Headers["Content-Type"])
					assert.Equal(t, `ok`, response.Body)
				},
			},
		},
		{
			"POST: it should send an array payload to the API",
			args{
				request: &BotHttpRequest{
					Method: "POST",
					URL:    server.URL + "/user/create",
					Body: []interface{}{
						"a cool",
						"value",
					},
				},
				response:            `ok`,
				responseContentType: "text/plain",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "POST", request.Method)
					assert.Equal(t, "/user/create", request.URL.Path)
					body, err := io.ReadAll(request.Body)
					assert.Equal(t, nil, err)
					assert.Equal(t, string(body), `["a cool","value"]`)
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, "200 OK", response.Status)
					assert.Equal(t, http.StatusOK, response.Code)
					assert.Equal(t, `ok`, response.Body)
				},
			},
		},
		{
			"POST: it should encode a formdata payload to the API",
			args{
				request: &BotHttpRequest{
					Method: "POST",
					URL:    server.URL + "/user/create",
					Body: map[string]interface{}{
						"value1": "cool",
						"value2": "cooler",
					},
					Headers: map[string]string{
						"Content-Type": "application/x-www-form-urlencoded",
					},
				},
				response:            `ok`,
				responseContentType: "text/plain",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "POST", request.Method)
					assert.Equal(t, "/user/create", request.URL.Path)
					body, err := io.ReadAll(request.Body)
					assert.Equal(t, nil, err)
					assert.Equal(t, string(body), `value1=cool&value2=cooler`)
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, "200 OK", response.Status)
					assert.Equal(t, http.StatusOK, response.Code)
					assert.Equal(t, `ok`, response.Body)
				},
			},
		},
		{
			"POST: it should encode a complex formdata payload to the API",
			args{
				request: &BotHttpRequest{
					Method: "POST",
					URL:    server.URL + "/user/create",
					Body: map[string]interface{}{
						"value1": map[string]interface{}{
							"subvalue1": "blah",
							"subvalue2": "woo",
						},
						"value2": []string{
							"slice1",
							"slice2",
						},
					},
					Headers: map[string]string{
						"Content-Type": "application/x-www-form-urlencoded",
					},
				},
				response:            `ok`,
				responseContentType: "text/plain",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "POST", request.Method)
					assert.Equal(t, "/user/create", request.URL.Path)
					body, err := io.ReadAll(request.Body)
					assert.Equal(t, nil, err)
					escaped, err := url.QueryUnescape(string(body))
					assert.Equal(t, nil, err)
					assert.Equal(t, escaped, `value1[subvalue1]=blah&value1[subvalue2]=woo&value2[0]=slice1&value2[1]=slice2`)
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, "200 OK", response.Status)
					assert.Equal(t, http.StatusOK, response.Code)
					assert.Equal(t, `ok`, response.Body)
				},
			},
		},
		{
			"PUT: it should send a payload to the API",
			args{
				request: &BotHttpRequest{
					Method: "PUT",
					URL:    server.URL + "/user/111",
					Headers: map[string]string{
						"Accept":       "text/plain",
						"Content-Type": "text/json",
					},
					Body: `{"first":"Mario","last":"Vampa"}`,
				},
				response:            `ok`,
				responseContentType: "text/plain",
				responseStatusCode:  http.StatusAccepted,
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "PUT", request.Method)
					assert.Equal(t, "/user/111", request.URL.Path)
					assert.Equal(t, "text/plain", request.Header.Get("Accept"))
					body, err := io.ReadAll(request.Body)
					assert.Equal(t, nil, err)
					assert.Equal(t, string(body), `{"first":"Mario","last":"Vampa"}`)
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, "202 Accepted", response.Status)
					assert.Equal(t, http.StatusAccepted, response.Code)
					assert.Equal(t, `ok`, response.Body)
				},
			},
		},
		{
			"PATCH: it should send a payload to the API",
			args{
				request: &BotHttpRequest{
					Method: "patch",
					URL:    server.URL + "/user/111",
					Body: map[string]interface{}{
						"first": "Mario",
					},
					Headers: map[string]string{
						"Content-Type": "text/json",
					},
				},
				responseStatusCode: http.StatusNoContent,
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "PATCH", request.Method)
					assert.Equal(t, "/user/111", request.URL.Path)
					body, err := io.ReadAll(request.Body)
					assert.Equal(t, nil, err)
					assert.Equal(t, string(body), `{"first":"Mario"}`)
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, "204 No Content", response.Status)
					assert.Equal(t, http.StatusNoContent, response.Code)
				},
			},
		},
		{
			"DELETE: it should send a payload to the API",
			args{
				request: &BotHttpRequest{
					Method: "delete",
					URL:    server.URL + "/user/111",
					Body:   `{"__delete__":true}`,
					Headers: map[string]string{
						"Content-Type": "text/json",
					},
				},
				responseStatusCode: http.StatusNoContent,
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "DELETE", request.Method)
					assert.Equal(t, "/user/111", request.URL.Path)
					body, err := io.ReadAll(request.Body)
					assert.Equal(t, nil, err)
					assert.Equal(t, string(body), `{"__delete__":true}`)
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, "204 No Content", response.Status)
					assert.Equal(t, http.StatusNoContent, response.Code)
				},
			},
		},
		{
			"PUT: it should send a map[string]interface{} payload to the API",
			args{
				request: &BotHttpRequest{
					Method: "PUT",
					URL:    server.URL + "/user/create",
					Body: map[string]interface{}{
						"favoriteFoods": []string{
							"Mango",
							"Pineapple",
						},
						"first": "Luigi",
						"last":  "Vampa",
					},
					Headers: map[string]string{
						"Accept":  "text/plain",
						"x-hello": "world",
					},
				},
				response:            `ok`,
				responseContentType: "text/plain",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "PUT", request.Method)
					assert.Equal(t, "/user/create", request.URL.Path)
					assert.Equal(t, "text/plain", request.Header.Get("Accept"))
					assert.Equal(t, "world", request.Header.Get("x-hello"))
					body, err := io.ReadAll(request.Body)
					assert.Equal(t, nil, err)
					// Verify that we can deserialize our body into an expected format
					user := &User{}
					err = json.Unmarshal(body, user)
					assert.Equal(t, nil, err)
					assert.Equal(t, "Luigi", user.First)
					assert.Equal(t, "Vampa", user.Last)
					assert.Equal(t, "Mango", user.FavoriteFoods[0])
					assert.Equal(t, "Pineapple", user.FavoriteFoods[1])
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, "200 OK", response.Status)
					assert.Equal(t, http.StatusOK, response.Code)
					assert.Equal(t, `ok`, response.Body)
				},
			},
		},
		{
			"it should reject unknown HTTP Method",
			args{
				request: &BotHttpRequest{
					Method: "foo",
					URL:    server.URL + "/users",
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, "Bad Request", response.Status)
					assert.Equal(t, http.StatusBadRequest, response.Code)
					if responseObject, ok := response.Body.(map[string]string); ok {
						assert.Equal(t, "Bad Request", responseObject["status"])
						assert.Equal(t, "invalid HTTP request method: foo", responseObject["error"])
					} else {
						assert.Fail(t, "expected response body to be a map")
					}
				},
			},
		},
		{
			"missing URL in http request",
			args{
				request: &BotHttpRequest{
					Method: "post",
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, "Bad Request", response.Status)
					assert.Equal(t, http.StatusBadRequest, response.Code)
					if responseObject, ok := response.Body.(map[string]string); ok {
						assert.Equal(t, "Bad Request", responseObject["status"])
						assert.Equal(t, "no url provided", responseObject["error"])
					} else {
						assert.Fail(t, "expected response body to be a map")
					}
				},
			},
		},
		{
			"Basic Authentication",
			args{
				integration: getIntegrationConnection("BASIC_AUTH", &wire.Credentials{
					"username": "luigi",
					"password": "abc123",
				}),
				request: &BotHttpRequest{
					Method: "GET",
					URL:    server.URL + "/array",
				},
				response:            `[{"foo":"bar"},{"hello":"world"}]`,
				responseContentType: "text/json",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "GET", request.Method)
					assert.Equal(t, "Basic bHVpZ2k6YWJjMTIz", request.Header.Get("Authorization"))
					assert.Equal(t, "/array", request.URL.Path)
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, "200 OK", response.Status)
					assert.Equal(t, http.StatusOK, response.Code)
				},
			},
		},
		{
			"Basic Authentication - missing username",
			args{
				integration: getIntegrationConnection("BASIC_AUTH", &wire.Credentials{
					"password": "abc123",
				}),
				request: &BotHttpRequest{
					Method: "GET",
					URL:    server.URL + "/array",
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, "Unauthorized", response.Status)
					assert.Equal(t, http.StatusUnauthorized, response.Code)
				},
			},
		},
		{
			"Basic Authentication - missing password",
			args{
				integration: getIntegrationConnection("BASIC_AUTH", &wire.Credentials{
					"username": "luigi",
				}),
				request: &BotHttpRequest{
					Method: "GET",
					URL:    server.URL + "/array",
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, "Unauthorized", response.Status)
					assert.Equal(t, http.StatusUnauthorized, response.Code)
				},
			},
		},
		{
			"API Key Authentication: header",
			args{
				integration: getIntegrationConnection("API_KEY", &wire.Credentials{
					"apikey":        "1234",
					"location":      "header",
					"locationName":  "Authorization",
					"locationValue": "Bearer ${apikey}",
				}),
				request: &BotHttpRequest{
					Method: "GET",
					URL:    server.URL + "/array",
				},
				response:            `[{"foo":"bar"},{"hello":"world"}]`,
				responseContentType: "text/json",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "Bearer 1234", request.Header.Get("Authorization"))
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, http.StatusOK, response.Code)
				},
			},
		},
		{
			"API Key Authentication: header, use default template",
			args{
				integration: getIntegrationConnection("API_KEY", &wire.Credentials{
					"apikey":       "1234",
					"location":     "header",
					"locationName": "x-api-key",
				}),
				request: &BotHttpRequest{
					Method: "GET",
					URL:    server.URL + "/array",
				},
				response:            `[{"foo":"bar"},{"hello":"world"}]`,
				responseContentType: "text/json",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "1234", request.Header.Get("x-api-key"))
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, http.StatusOK, response.Code)
				},
			},
		},
		{
			"API Key Authentication: query string",
			args{
				integration: getIntegrationConnection("API_KEY", &wire.Credentials{
					"apikey":        "1234",
					"location":      "querystring",
					"locationName":  "key",
					"locationValue": "${apikey}",
				}),
				request: &BotHttpRequest{
					Method: "GET",
					URL:    server.URL + "/array",
				},
				response:            `[{"foo":"bar"},{"hello":"world"}]`,
				responseContentType: "text/json",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "1234", request.URL.Query().Get("key"))
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, http.StatusOK, response.Code)
				},
			},
		},
		{
			"API Key Authentication: invalid location type",
			args{
				integration: getIntegrationConnection("API_KEY", &wire.Credentials{
					"apikey":        "1234",
					"location":      "foo",
					"locationName":  "key",
					"locationValue": "${apikey}",
				}),
				request: &BotHttpRequest{
					Method: "GET",
					URL:    server.URL + "/array",
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, http.StatusUnauthorized, response.Code)
					assert.Equal(t, "Unauthorized", response.Status)
				},
			},
		},
		{
			"API Key Authentication: missing api key",
			args{
				integration: getIntegrationConnection("API_KEY", &wire.Credentials{}),
				request: &BotHttpRequest{
					Method: "GET",
					URL:    server.URL + "/array",
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, http.StatusUnauthorized, response.Code)
					assert.Equal(t, "Unauthorized", response.Status)
				},
			},
		},
		{
			"API Key Authentication: missing location",
			args{
				integration: getIntegrationConnection("API_KEY", &wire.Credentials{
					"apikey": "1234",
				}),
				request: &BotHttpRequest{
					Method: "GET",
					URL:    server.URL + "/array",
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, http.StatusUnauthorized, response.Code)
					assert.Equal(t, "Unauthorized", response.Status)
				},
			},
		},
		{
			"API Key Authentication: missing locationName",
			args{
				integration: getIntegrationConnection("API_KEY", &wire.Credentials{
					"apikey":   "1234",
					"location": "header",
				}),
				request: &BotHttpRequest{
					Method: "GET",
					URL:    server.URL + "/array",
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, http.StatusUnauthorized, response.Code)
					assert.Equal(t, "Unauthorized", response.Status)
				},
			},
		},
		{
			"OAuth 2 Client Credentials authentication - no existing token",
			args{
				integration: getIntegrationConnection("OAUTH2_CLIENT_CREDENTIALS", &wire.Credentials{
					"tokenUrl":     server.URL + "/oauth/token",
					"clientId":     "suchclient",
					"clientSecret": "muchsecret",
					"scopes":       "api,refresh_token",
				}),
				credentialAccessors: &oauth2.CredentialAccessors{
					Fetch: noOpFetch,
					Save: func(item *wire.Item, ic *wire.IntegrationConnection) error {
						credentialSaveCalled = true
						// Verify that the expected fields were called
						accessToken, _ := item.GetField(oauth2.AccessTokenField)
						assert.Equal(t, "abcd1234", accessToken)
						tokenType, _ := item.GetField(oauth2.TokenTypeField)
						assert.Equal(t, "bearer", tokenType)
						userReference, _ := item.GetField(oauth2.UserField)
						expectUserReference := &wire.Item{}
						expectUserReference.SetField(commonfields.Id, "user123")
						assert.Equal(t, expectUserReference, userReference)
						integrationKey, _ := item.GetField(oauth2.IntegrationField)
						assert.Equal(t, "luigi/foo.someservice", integrationKey)
						return nil
					},
					Delete: noOpDelete,
				},
				request: &BotHttpRequest{
					Method: "GET",
					URL:    server.URL + "/array",
				},
				requestAsserts: func(t *testing.T, request *http.Request) {
					// If this is a request for the access token, respond accordingly
					if request.URL.Path == "/oauth/token" {
						assert.Equal(t, "POST", request.Method)
						err := request.ParseForm()
						assert.Nil(t, err)
						assert.Equal(t, "client_credentials", request.Form.Get("grant_type"))
						assert.Equal(t, "api refresh_token", request.Form.Get("scope"))
						expectedAuthHeader := "Basic " + base64.StdEncoding.EncodeToString([]byte("suchclient:muchsecret"))
						assert.Equal(t, expectedAuthHeader, request.Header.Get("Authorization"))
						accessTokenResponse, err := json.Marshal(map[string]interface{}{
							"access_token": "abcd1234",
							"token_type":   "bearer",
						})
						assert.Nil(t, err)
						serveResponseBody = string(accessTokenResponse)
						serveContentType = "application/json"
						serveStatusCode = 200
					} else if request.URL.Path == "/array" {
						assert.Equal(t, "GET", request.Method)
						assert.Equal(t, "Bearer abcd1234", request.Header.Get("Authorization"))
						serveResponseBody = `[{"foo":"bar"},{"hello":"world"}]`
						serveContentType = "text/json"
					} else {
						assert.Fail(t, "unexpected request")
					}
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, "200 OK", response.Status)
					assert.Equal(t, http.StatusOK, response.Code)
					// Verify that the expected URLs were hit the expected number of times
					assert.Equal(t, uint32(1), countRequests["/oauth/token"])
					assert.Equal(t, uint32(1), countRequests["/array"])
					assert.True(t, credentialFetchCalled, "a credential fetch should have occurred")
					assert.True(t, credentialSaveCalled, "a new credential should have been saved")
				},
			},
		},
		{
			"OAuth 2 Client Credentials authentication - don't reauthenticate if non-expired token exists",
			args{
				integration: getIntegrationConnection("OAUTH2_CLIENT_CREDENTIALS", &wire.Credentials{
					"tokenUrl":     server.URL + "/oauth/token",
					"clientId":     "suchclient",
					"clientSecret": "muchsecret",
					"scopes":       "api,refresh_token",
				}),
				credentialAccessors: &oauth2.CredentialAccessors{
					Fetch: func(ic *wire.IntegrationConnection) (*wire.Item, error) {
						credentialFetchCalled = true
						item := &wire.Item{
							oauth2.AccessTokenField:           "abcd1234",
							oauth2.TokenTypeField:             "bearer",
							oauth2.AccessTokenExpirationField: time.Now().Add(time.Hour).Unix(),
						}
						return item, nil
					},
					Save:   noOpSave,
					Delete: noOpDelete,
				},
				request: &BotHttpRequest{
					Method: "GET",
					URL:    server.URL + "/array",
				},
				requestAsserts: func(t *testing.T, request *http.Request) {
					// If this is a request for the access token, respond accordingly
					if request.URL.Path == "/array" {
						assert.Equal(t, "GET", request.Method)
						assert.Equal(t, "Bearer abcd1234", request.Header.Get("Authorization"))
						serveResponseBody = `[{"foo":"bar"},{"hello":"world"}]`
						serveContentType = "text/json"
					} else {
						assert.Fail(t, "unexpected request")
					}
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, "200 OK", response.Status)
					assert.Equal(t, http.StatusOK, response.Code)
					// Verify that the expected URLs were hit the expected number of times
					assert.Equal(t, uint32(0), countRequests["/oauth/token"])
					assert.Equal(t, uint32(1), countRequests["/array"])
					assert.False(t, credentialSaveCalled, "no credential save should have occurred")
					assert.True(t, credentialFetchCalled, "credential should have been retrieved from DB")
				},
			},
		},
		{
			"OAuth 2 Client Credentials authentication - reauthenticate if 401 is returned",
			args{
				integration: getIntegrationConnection("OAUTH2_CLIENT_CREDENTIALS", &wire.Credentials{
					"tokenUrl":     server.URL + "/oauth/token",
					"clientId":     "suchclient",
					"clientSecret": "muchsecret",
				}),
				credentialAccessors: &oauth2.CredentialAccessors{
					Fetch: func(ic *wire.IntegrationConnection) (*wire.Item, error) {
						credentialFetchCalled = true
						item := &wire.Item{
							oauth2.AccessTokenField:           "oldtoken",
							oauth2.TokenTypeField:             "bearer",
							oauth2.AccessTokenExpirationField: time.Now().Add(time.Hour).Unix(),
						}
						return item, nil
					},
					Save: func(item *wire.Item, ic *wire.IntegrationConnection) error {
						credentialSaveCalled = true
						// Verify that the expected fields were provided
						accessToken, _ := item.GetField(oauth2.AccessTokenField)
						assert.Equal(t, "newtoken", accessToken)
						tokenType, _ := item.GetField(oauth2.TokenTypeField)
						assert.Equal(t, "bearer", tokenType)
						return nil
					},
					Delete: noOpDelete,
				},
				request: &BotHttpRequest{
					Method: "GET",
					URL:    server.URL + "/array",
				},
				requestAsserts: func(t *testing.T, request *http.Request) {
					// If this is a request for the access token, respond accordingly
					if request.URL.Path == "/oauth/token" {
						assert.Equal(t, "POST", request.Method)
						err := request.ParseForm()
						assert.Nil(t, err)
						assert.Equal(t, "client_credentials", request.Form.Get("grant_type"))
						// verify no scope param was sent because we configured no scopes in the credentials
						assert.False(t, request.Form.Has("scope"))
						expectedAuthHeader := "Basic " + base64.StdEncoding.EncodeToString([]byte("suchclient:muchsecret"))
						assert.Equal(t, expectedAuthHeader, request.Header.Get("Authorization"))
						accessTokenResponse, err := json.Marshal(map[string]interface{}{
							"access_token": "newtoken",
							"token_type":   "bearer",
						})
						assert.Nil(t, err)
						serveResponseBody = string(accessTokenResponse)
						serveContentType = "application/json"
						serveStatusCode = 200
					} else if request.URL.Path == "/array" {
						assert.Equal(t, "GET", request.Method)
						// If we get called with the old token, return 401
						if request.Header.Get("Authorization") == "Bearer oldtoken" {
							serveResponseBody = `{"error":"access_denied"}`
							serveContentType = "text/json"
							serveStatusCode = http.StatusUnauthorized
						} else {
							// Otherwise verify that we are being called with the new token
							assert.Equal(t, "GET", request.Method)
							assert.Equal(t, "Bearer newtoken", request.Header.Get("Authorization"))
							serveResponseBody = `[{"foo":"bar"},{"hello":"world"}]`
							serveContentType = "text/json"
							serveStatusCode = http.StatusOK
						}
					} else {
						assert.Fail(t, "unexpected request")
					}
				},
				responseAsserts: func(t *testing.T, response *BotHttpResponse) {
					assert.Equal(t, "200 OK", response.Status)
					assert.Equal(t, http.StatusOK, response.Code)
					// Verify that the expected URLs were hit the expected number of times
					assert.Equal(t, uint32(1), countRequests["/oauth/token"])
					assert.Equal(t, uint32(2), countRequests["/array"])
					assert.True(t, credentialFetchCalled, "a credential fetch should have occurred")
					assert.True(t, credentialSaveCalled, "a new credential should have been saved")
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.args.credentialAccessors != nil {
				oauth2.SetUserCredentialAccessors(tt.args.credentialAccessors)
			} else {
				oauth2.InitCredentialAccessors()
			}
			credentialSaveCalled = false
			credentialFetchCalled = false
			botApi := NewBotHttpAPI(tt.args.integration)
			serveResponseBody = tt.args.response
			serveContentType = tt.args.responseContentType
			serveStatusCode = tt.args.responseStatusCode
			// Default to serving a 200 status code
			if serveStatusCode == 0 {
				serveStatusCode = 200
			}
			requestAsserts = tt.args.requestAsserts
			testInstance = t
			countRequests = map[string]uint32{}
			reqsToMake := 1
			if tt.args.makeRequestNTimes > 1 {
				reqsToMake = tt.args.makeRequestNTimes
			}
			var actualResponse *BotHttpResponse
			for {
				reqsToMake = reqsToMake - 1
				actualResponse = botApi.Request(tt.args.request)
				if reqsToMake == 0 {
					break
				}
			}
			if tt.args.responseAsserts != nil {
				tt.args.responseAsserts(t, actualResponse)
			}
		})
	}
}

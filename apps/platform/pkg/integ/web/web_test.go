package web

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func Test_RunAction(t *testing.T) {

	creds := &adapt.Credentials{}
	(*creds)["apikey"] = "1234"
	session := &sess.Session{}

	var serveResponseBody, serveContentType string
	var testInstance *testing.T
	var requestAsserts func(t *testing.T, request *http.Request)

	// set up a mock server to handle our test requests
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if requestAsserts != nil && testInstance != nil {
			requestAsserts(testInstance, r)
		}
		w.Header().Set("content-type", serveContentType)
		w.Write([]byte(serveResponseBody))
	}))
	defer (func() {
		server.Close()
	})()

	tests := []struct {
		name                string
		integration         *meta.Integration
		method              string
		requestOptions      RequestOptions
		response            string
		responseContentType string
		requestAsserts      func(t *testing.T, request *http.Request)
		responseAsserts     func(t *testing.T, responseData interface{})
		wantErr             string
	}{
		{
			"GET: it should handle JSON object responses",
			&meta.Integration{
				BaseURL: server.URL,
				Type:    "uesio/core.web",
				Headers: map[string]string{},
			},
			"get",
			RequestOptions{
				URL: "/test",
			},
			`{"foo":"bar"}`,
			"application/json",
			func(t *testing.T, request *http.Request) {
				assert.Equal(t, "GET", request.Method)
				assert.Equal(t, "/test", request.URL.Path)
			},
			func(t *testing.T, responseData interface{}) {
				if responseMap, ok := responseData.(*map[string]interface{}); ok {
					assert.Equal(t, "bar", (*responseMap)["foo"])
				} else {
					assert.Fail(t, "response is not a map[string]interface{}")
				}
			},
			"",
		},
		{
			"GET: it should handle JSON array responses",
			&meta.Integration{
				BaseURL: server.URL,
				Type:    "uesio/core.web",
				Headers: map[string]string{},
			},
			"get",
			RequestOptions{
				URL: "/array",
			},
			`[{"foo":"bar"},{"hello":"world"}]`,
			"text/json",
			func(t *testing.T, request *http.Request) {
				assert.Equal(t, "GET", request.Method)
				assert.Equal(t, "/array", request.URL.Path)
			},
			func(t *testing.T, responseData interface{}) {
				if responses, ok := responseData.(*[]interface{}); ok {
					if response, isMap := (*responses)[1].(map[string]interface{}); isMap {
						assert.Equal(t, "world", response["hello"])
					}
				} else {
					assert.Fail(t, "response is not a valid array")
				}

			},
			"",
		},
		{
			"GET: it should return other response types as raw data, and merge credentials into headers",
			&meta.Integration{
				BaseURL: server.URL,
				Type:    "uesio/core.web",
				Headers: map[string]string{
					"Accept":        "text/xml",
					"Authorization": "${apikey}",
				},
			},
			"get",
			RequestOptions{
				URL: "/xml",
			},
			`<books/>`,
			"text/xml",
			func(t *testing.T, request *http.Request) {
				assert.Equal(t, "GET", request.Method)
				assert.Equal(t, "/xml", request.URL.Path)
				assert.Equal(t, "text/xml", request.Header.Get("Accept"))
				assert.Equal(t, "1234", request.Header.Get("Authorization"))
			},
			func(t *testing.T, responseData interface{}) {
				assert.Equal(t, `<books/>`, responseData)
			},
			"",
		},
		{
			"POST: it should send a payload to the API",
			&meta.Integration{
				BaseURL: server.URL,
				Type:    "uesio/core.web",
				Headers: map[string]string{
					"Accept":        "text/plain",
					"Content-Type":  "text/json",
					"Authorization": "${apikey}",
				},
			},
			"post",
			RequestOptions{
				URL:  "/user/create",
				Body: `{"first":"Luigi","last":"Vampa"}`,
			},
			`ok`,
			"text/plain",
			func(t *testing.T, request *http.Request) {
				assert.Equal(t, "POST", request.Method)
				assert.Equal(t, "/user/create", request.URL.Path)
				assert.Equal(t, "text/plain", request.Header.Get("Accept"))
				assert.Equal(t, "1234", request.Header.Get("Authorization"))
				body, err := io.ReadAll(request.Body)
				assert.Equal(t, nil, err)
				assert.Equal(t, string(body), `{"first":"Luigi","last":"Vampa"}`)
			},
			func(t *testing.T, responseData interface{}) {
				assert.Equal(t, `ok`, responseData)
			},
			"",
		},
		{
			"PUT: it should send a payload to the API",
			&meta.Integration{
				BaseURL: server.URL,
				Type:    "uesio/core.web",
				Headers: map[string]string{
					"Accept":       "text/plain",
					"Content-Type": "text/json",
				},
			},
			"put",
			RequestOptions{
				URL:  "/user/111",
				Body: `{"first":"Mario","last":"Vampa"}`,
			},
			`ok`,
			"text/plain",
			func(t *testing.T, request *http.Request) {
				assert.Equal(t, "PUT", request.Method)
				assert.Equal(t, "/user/111", request.URL.Path)
				assert.Equal(t, "text/plain", request.Header.Get("Accept"))
				body, err := io.ReadAll(request.Body)
				assert.Equal(t, nil, err)
				assert.Equal(t, string(body), `{"first":"Mario","last":"Vampa"}`)
			},
			func(t *testing.T, responseData interface{}) {
				assert.Equal(t, `ok`, responseData)
			},
			"",
		},
		{
			"PATCH: it should send a payload to the API",
			&meta.Integration{
				BaseURL: server.URL,
				Type:    "uesio/core.web",
				Headers: map[string]string{
					"Accept":       "text/plain",
					"Content-Type": "text/json",
				},
			},
			"patch",
			RequestOptions{
				URL: "/user/111",
				Body: map[string]interface{}{
					"first": "Mario",
				},
			},
			`ok`,
			"text/plain",
			func(t *testing.T, request *http.Request) {
				assert.Equal(t, "PATCH", request.Method)
				assert.Equal(t, "/user/111", request.URL.Path)
				assert.Equal(t, "text/plain", request.Header.Get("Accept"))
				body, err := io.ReadAll(request.Body)
				assert.Equal(t, nil, err)
				assert.Equal(t, string(body), `{"first":"Mario"}`)
			},
			func(t *testing.T, responseData interface{}) {
				assert.Equal(t, `ok`, responseData)
			},
			"",
		},
		{
			"DELETE: it should send a payload to the API",
			&meta.Integration{
				BaseURL: server.URL,
				Type:    "uesio/core.web",
				Headers: map[string]string{
					"Accept":       "text/plain",
					"Content-Type": "text/json",
				},
			},
			"delete",
			RequestOptions{
				URL:  "/user/111",
				Body: `{"__delete__":true}`,
			},
			`deleted`,
			"text/plain",
			func(t *testing.T, request *http.Request) {
				assert.Equal(t, "DELETE", request.Method)
				assert.Equal(t, "/user/111", request.URL.Path)
				assert.Equal(t, "text/plain", request.Header.Get("Accept"))
				body, err := io.ReadAll(request.Body)
				assert.Equal(t, nil, err)
				assert.Equal(t, string(body), `{"__delete__":true}`)
			},
			func(t *testing.T, responseData interface{}) {
				assert.Equal(t, `deleted`, responseData)
			},
			"",
		},
		{
			"it should reject unknown action names",
			&meta.Integration{
				BaseURL: server.URL,
				Type:    "uesio/core.web",
				Headers: map[string]string{},
			},
			"foooo",
			RequestOptions{
				URL: "/users",
			},
			"",
			"",
			nil,
			nil,
			"invalid action name for web integration",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			wi := &WebIntegration{}
			serveResponseBody = tt.response
			serveContentType = tt.responseContentType
			requestAsserts = tt.requestAsserts
			testInstance = t
			conn, _ := wi.GetIntegrationConnection(tt.integration, session, creds)
			actualResponse, err := conn.RunAction(tt.method, tt.requestOptions)
			if tt.wantErr != "" {
				assert.EqualError(t, err, tt.wantErr, "expected error for test case: "+tt.name)
			} else if tt.responseAsserts != nil {
				tt.responseAsserts(t, actualResponse)
			}
		})
	}
}

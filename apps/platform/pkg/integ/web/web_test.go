package web

import (
	"io"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
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
	var countRequests map[string]uint32

	// set up a mock server to handle our test requests
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reqURL := r.URL.String()
		if count, isPresent := countRequests[reqURL]; isPresent {
			atomic.AddUint32(&count, 1)
		} else {
			countRequests[reqURL] = 1
		}
		if requestAsserts != nil && testInstance != nil {
			requestAsserts(testInstance, r)
		}
		w.Header().Set("content-type", serveContentType)
		w.Write([]byte(serveResponseBody))
	}))
	defer (func() {
		server.Close()
	})()

	type args struct {
		method              string
		requestOptions      interface{}
		response            string
		responseContentType string
		requestAsserts      func(t *testing.T, request *http.Request)
		responseAsserts     func(t *testing.T, responseData interface{})
		wantErr             string
		makeRequestNTimes   int
	}

	tests := []struct {
		name        string
		integration *meta.Integration
		args        args
	}{
		{
			"GET: it should handle JSON object responses",
			&meta.Integration{
				BaseURL: server.URL,
				Type:    "uesio/core.web",
				Headers: map[string]string{},
			},
			args{
				method: "get",
				requestOptions: &RequestOptions{
					URL: "/test",
				},
				response:            `{"foo":"bar"}`,
				responseContentType: "application/json",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "GET", request.Method)
					assert.Equal(t, "/test", request.URL.Path)
					assert.EqualValues(t, uint32(1), countRequests[request.URL.String()])
				},
				responseAsserts: func(t *testing.T, responseData interface{}) {
					if responseMap, ok := responseData.(*map[string]interface{}); ok {
						assert.Equal(t, "bar", (*responseMap)["foo"])
					} else {
						assert.Fail(t, "response is not a map[string]interface{}")
					}
				},
			},
		},
		{
			"GET: it should handle JSON array responses",
			&meta.Integration{
				BaseURL: server.URL,
				Type:    "uesio/core.web",
				Headers: map[string]string{},
			},
			args{
				method: "get",
				requestOptions: &RequestOptions{
					URL: "/array",
				},
				response:            `[{"foo":"bar"},{"hello":"world"}]`,
				responseContentType: "text/json",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "GET", request.Method)
					assert.Equal(t, "/array", request.URL.Path)
				},
				responseAsserts: func(t *testing.T, responseData interface{}) {
					if responses, ok := responseData.(*[]interface{}); ok {
						if response, isMap := (*responses)[1].(map[string]interface{}); isMap {
							assert.Equal(t, "world", response["hello"])
						}
					} else {
						assert.Fail(t, "response is not a valid array")
					}
				},
			},
		},
		{
			"GET: it should return a cached result if there was a previous request",
			&meta.Integration{
				BaseURL: server.URL,
				Type:    "uesio/core.web",
				Headers: map[string]string{},
			},
			args{
				method: "get",
				requestOptions: &RequestOptions{
					URL:   "/test/cached",
					Cache: true,
				},
				response:            `{"foo":"bar"}`,
				responseContentType: "application/json",
				makeRequestNTimes:   2,
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "GET", request.Method)
					assert.Equal(t, "/test/cached", request.URL.Path)
					assert.EqualValues(t, uint32(1), countRequests[request.URL.String()])
				},
				responseAsserts: func(t *testing.T, responseData interface{}) {
					if responseMap, ok := responseData.(*map[string]interface{}); ok {
						assert.Equal(t, "bar", (*responseMap)["foo"])
					} else {
						assert.Fail(t, "response is not a map[string]interface{}")
					}
				},
			},
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
			args{
				method: "get",
				requestOptions: &RequestOptions{
					URL: "/xml",
				},
				response:            `<books/>`,
				responseContentType: "text/xml",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "GET", request.Method)
					assert.Equal(t, "/xml", request.URL.Path)
					assert.Equal(t, "text/xml", request.Header.Get("Accept"))
					assert.Equal(t, "1234", request.Header.Get("Authorization"))
				},
				responseAsserts: func(t *testing.T, responseData interface{}) {
					assert.Equal(t, `<books/>`, responseData)
				},
			},
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
			args{
				method: "post",
				requestOptions: &RequestOptions{
					URL:  "/user/create",
					Body: `{"first":"Luigi","last":"Vampa"}`,
				},
				response:            `ok`,
				responseContentType: "text/plain",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "POST", request.Method)
					assert.Equal(t, "/user/create", request.URL.Path)
					assert.Equal(t, "text/plain", request.Header.Get("Accept"))
					assert.Equal(t, "1234", request.Header.Get("Authorization"))
					body, err := io.ReadAll(request.Body)
					assert.Equal(t, nil, err)
					assert.Equal(t, string(body), `{"first":"Luigi","last":"Vampa"}`)
				},
				responseAsserts: func(t *testing.T, responseData interface{}) {
					assert.Equal(t, `ok`, responseData)
				},
			},
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
			args{
				method: "put",
				requestOptions: &RequestOptions{
					URL:  "/user/111",
					Body: `{"first":"Mario","last":"Vampa"}`,
				},
				response:            `ok`,
				responseContentType: "text/plain",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "PUT", request.Method)
					assert.Equal(t, "/user/111", request.URL.Path)
					assert.Equal(t, "text/plain", request.Header.Get("Accept"))
					body, err := io.ReadAll(request.Body)
					assert.Equal(t, nil, err)
					assert.Equal(t, string(body), `{"first":"Mario","last":"Vampa"}`)
				},
				responseAsserts: func(t *testing.T, responseData interface{}) {
					assert.Equal(t, `ok`, responseData)
				},
			},
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
			args{
				method: "patch",
				requestOptions: &RequestOptions{
					URL: "/user/111",
					Body: map[string]interface{}{
						"first": "Mario",
					},
				},
				response:            `ok`,
				responseContentType: "text/plain",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "PATCH", request.Method)
					assert.Equal(t, "/user/111", request.URL.Path)
					assert.Equal(t, "text/plain", request.Header.Get("Accept"))
					body, err := io.ReadAll(request.Body)
					assert.Equal(t, nil, err)
					assert.Equal(t, string(body), `{"first":"Mario"}`)
				},
				responseAsserts: func(t *testing.T, responseData interface{}) {
					assert.Equal(t, `ok`, responseData)
				},
			},
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
			args{
				method: "delete",
				requestOptions: &RequestOptions{
					URL:  "/user/111",
					Body: `{"__delete__":true}`,
				},
				response:            `deleted`,
				responseContentType: "text/plain",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "DELETE", request.Method)
					assert.Equal(t, "/user/111", request.URL.Path)
					assert.Equal(t, "text/plain", request.Header.Get("Accept"))
					body, err := io.ReadAll(request.Body)
					assert.Equal(t, nil, err)
					assert.Equal(t, string(body), `{"__delete__":true}`)
				},
				responseAsserts: func(t *testing.T, responseData interface{}) {
					assert.Equal(t, `deleted`, responseData)
				},
			},
		},
		{
			"it should reject unknown action names",
			&meta.Integration{
				BaseURL: server.URL,
				Type:    "uesio/core.web",
				Headers: map[string]string{},
			},
			args{
				method: "foooo",
				requestOptions: &RequestOptions{
					URL: "/users",
				},
				wantErr: "invalid action name for web integration",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			wi := &WebIntegration{}
			serveResponseBody = tt.args.response
			serveContentType = tt.args.responseContentType
			requestAsserts = tt.args.requestAsserts
			testInstance = t
			countRequests = map[string]uint32{}
			conn, _ := wi.GetIntegrationConnection(tt.integration, session, creds)
			reqsToMake := 1
			if tt.args.makeRequestNTimes > 1 {
				reqsToMake = tt.args.makeRequestNTimes
			}
			var actualResponse interface{}
			var err error
			for {
				reqsToMake = reqsToMake - 1
				actualResponse, err = conn.RunAction(tt.args.method, tt.args.requestOptions)
				if reqsToMake == 0 {
					break
				}
			}
			if tt.args.wantErr != "" {
				assert.EqualError(t, err, tt.args.wantErr, "expected error for test case: "+tt.name)
			} else if tt.args.responseAsserts != nil {
				tt.args.responseAsserts(t, actualResponse)
			}
		})
	}
}

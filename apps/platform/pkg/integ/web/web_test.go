package web

import (
	"encoding/json"
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

	type ResponseAssertsFunc func(t *testing.T, responseArgs *ResponseArgs)

	type args struct {
		method              string
		requestOptions      interface{}
		response            string
		responseContentType string
		requestAsserts      func(t *testing.T, request *http.Request)
		responseAsserts     ResponseAssertsFunc
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
				responseAsserts: func(t *testing.T, responseArgs *ResponseArgs) {
					if responseMap, ok := responseArgs.responseData.(*map[string]interface{}); ok {
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
				responseAsserts: func(t *testing.T, responseArgs *ResponseArgs) {
					if responses, ok := responseArgs.responseData.(*[]interface{}); ok {
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
				responseAsserts: func(t *testing.T, responseArgs *ResponseArgs) {
					if responseMap, ok := responseArgs.responseData.(*map[string]interface{}); ok {
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
				responseAsserts: func(t *testing.T, responseArgs *ResponseArgs) {
					assert.Equal(t, `<books/>`, responseArgs.responseData)
				},
			},
		},
		{
			"GET: it should deserialize directly into a provided response struct",
			&meta.Integration{
				BaseURL: server.URL,
				Type:    "uesio/core.web",
				Headers: map[string]string{},
			},
			args{
				method: "get",
				requestOptions: &RequestOptions{
					URL:          "/address",
					ResponseData: &Address{},
				},
				response:            `{"street1":"123 Main St","street2":"Apt 1","zip":"37411","state":"TN","city":"Chattanooga","country":"US"}`,
				responseContentType: "text/json",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "GET", request.Method)
					assert.Equal(t, "/address", request.URL.Path)
				},
				responseAsserts: func(t *testing.T, responseArgs *ResponseArgs) {
					if address, ok := responseArgs.responseData.(*Address); ok {
						// First validate that the deserialized responseData is in the expected format
						assert.Equal(t, "123 Main St", address.Street1)
						assert.Equal(t, "Apt 1", address.Street2)
						assert.Equal(t, "Chattanooga", address.City)
						assert.Equal(t, "TN", address.State)
						assert.Equal(t, "37411", address.ZipPostalCode)
						assert.Equal(t, "US", address.Country)
						// Next, make sure that this is the same struct that we provided in RequestOptions
						if requestOpts, ok2 := responseArgs.requestOptions.(*RequestOptions); ok2 {
							assert.Equal(t, address, requestOpts.ResponseData)
						} else {
							assert.Fail(t, "response body struct was not the same as the one we provided")
						}
					} else {
						assert.Fail(t, "response body could not be deserialized into the expected Address struct")
					}
				},
			},
		},
		{
			"GET: it should return an error if the response body can't be deserialized into the provided response struct",
			&meta.Integration{
				BaseURL: server.URL,
				Type:    "uesio/core.web",
				Headers: map[string]string{},
			},
			args{
				method: "get",
				requestOptions: &RequestOptions{
					URL:          "/not-an-address-struct",
					ResponseData: &Address{},
				},
				response:            `["do I LOOK like an Address struct to YOU? DO I??????"]`,
				responseContentType: "text/json",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "GET", request.Method)
					assert.Equal(t, "/not-an-address-struct", request.URL.Path)
				},
				responseAsserts: func(t *testing.T, responseArgs *ResponseArgs) {
					switch responseArgs.responseData.(type) {
					case nil:
						assert.Nil(t, responseArgs.responseData, "nil response should be returned")
					case *Address:
						assert.Fail(t, "we were not expecting the response body to be deserialized into an Address!")
					}
				},
				wantErr: "json: cannot unmarshal array into Go value of type web.Address",
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
				responseAsserts: func(t *testing.T, responseArgs *ResponseArgs) {
					assert.Equal(t, `ok`, responseArgs.responseData)
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
				responseAsserts: func(t *testing.T, responseArgs *ResponseArgs) {
					assert.Equal(t, `ok`, responseArgs.responseData)
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
				responseAsserts: func(t *testing.T, responseArgs *ResponseArgs) {
					assert.Equal(t, `ok`, responseArgs.responseData)
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
				responseAsserts: func(t *testing.T, responseArgs *ResponseArgs) {
					assert.Equal(t, `deleted`, responseArgs.responseData)
				},
			},
		},
		{
			"POST from BOT: it should send a payload to the API",
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
				requestOptions: map[string]interface{}{
					"url":   "/user/create",
					"cache": false,
					"body":  `{"first":"Luigi","last":"Vampa"}`,
					"headers": map[string]interface{}{
						"x-foo": "bar",
					},
				},
				response:            `ok`,
				responseContentType: "text/plain",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "POST", request.Method)
					assert.Equal(t, "/user/create", request.URL.Path)
					assert.Equal(t, "text/plain", request.Header.Get("Accept"))
					assert.Equal(t, "1234", request.Header.Get("Authorization"))
					assert.Equal(t, "bar", request.Header.Get("x-foo"))
					body, err := io.ReadAll(request.Body)
					assert.Equal(t, nil, err)
					assert.Equal(t, string(body), `{"first":"Luigi","last":"Vampa"}`)
				},
				responseAsserts: func(t *testing.T, responseArgs *ResponseArgs) {
					assert.Equal(t, `ok`, responseArgs.responseData)
				},
			},
		},
		{
			"PUT from BOT: it should send a payload to the API",
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
				method: "put",
				requestOptions: map[string]interface{}{
					"url":   "/user/create",
					"cache": false,
					"body": map[string]interface{}{
						"favoriteFoods": []string{
							"Mango",
							"Pineapple",
						},
						"first": "Luigi",
						"last":  "Vampa",
					},
					"headers": map[string]interface{}{
						"x-hello": "world",
					},
				},
				response:            `ok`,
				responseContentType: "text/plain",
				requestAsserts: func(t *testing.T, request *http.Request) {
					assert.Equal(t, "PUT", request.Method)
					assert.Equal(t, "/user/create", request.URL.Path)
					assert.Equal(t, "text/plain", request.Header.Get("Accept"))
					assert.Equal(t, "1234", request.Header.Get("Authorization"))
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
				responseAsserts: func(t *testing.T, responseArgs *ResponseArgs) {
					assert.Equal(t, `ok`, responseArgs.responseData)
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
		{
			"unexpected options struct passed",
			&meta.Integration{
				BaseURL: server.URL,
				Type:    "uesio/core.web",
				Headers: map[string]string{},
			},
			args{
				method: "post",
				requestOptions: RequestOptions{
					URL: "/users",
				},
				wantErr: "invalid options provided to web integration",
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
			}
			if tt.args.responseAsserts != nil {
				tt.args.responseAsserts(t, &ResponseArgs{
					actualResponse,
					tt.args.requestOptions,
				})
			}
		})
	}
}

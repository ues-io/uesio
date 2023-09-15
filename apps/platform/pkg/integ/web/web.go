package web

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/goutils"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	httpClient "github.com/thecloudmasters/uesio/pkg/http"
	"github.com/thecloudmasters/uesio/pkg/integ"
	"github.com/thecloudmasters/uesio/pkg/localcache"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

type RequestOptions struct {
	URL          string            `json:"url"`
	Cache        bool              `json:"cache"`
	Headers      map[string]string `json:"headers"`
	Body         interface{}       `json:"body"`
	ResponseData interface{}
}

type WebIntegration struct {
}

func (wi *WebIntegration) GetIntegrationConnection(integration *meta.Integration, session *sess.Session, credentials *adapt.Credentials) (integ.IntegrationConnection, error) {
	return &WebIntegrationConnection{
		session:     session,
		integration: integration,
		credentials: credentials,
	}, nil
}

type WebIntegrationConnection struct {
	session     *sess.Session
	integration *meta.Integration
	credentials *adapt.Credentials
}

func (wic *WebIntegrationConnection) GetCredentials() *adapt.Credentials {
	return wic.credentials
}

func (wic *WebIntegrationConnection) GetIntegration() *meta.Integration {
	return wic.integration
}

const (
	webRequestBody        = "web-request-body"
	webRequestContentType = "web-request-content-type"
)

func (wic *WebIntegrationConnection) RunAction(actionName string, requestOptions interface{}) (interface{}, error) {

	switch actionName {
	case "get", "post", "put", "patch", "delete":
		// TODO: Validate request options somehow
		result, err := wic.Request(strings.ToUpper(actionName), requestOptions)
		if err != nil {
			return nil, err
		}
		return result, nil
	}

	return nil, errors.New("invalid action name for web integration")

}

func (wic *WebIntegrationConnection) Request(methodName string, requestOptions interface{}) (interface{}, error) {
	var options *RequestOptions
	// Coming from TS/JS bots, RequestOptions will very likely be a map[string]interface{},
	// whereas coming from system bots, it will be a RequestOptions struct
	switch opts := requestOptions.(type) {
	case map[string]interface{}:
		var reqUrl string
		var reqHeaders map[string]string
		if urlString, isString := opts["url"].(string); isString {
			reqUrl = urlString
		}
		if rawHeaders, isMap := opts["headers"].(map[string]interface{}); isMap {
			reqHeaders = map[string]string{}
			for headerName, headerVal := range rawHeaders {
				if stringHeader, isStringVal := headerVal.(string); isStringVal {
					reqHeaders[headerName] = stringHeader
				}
			}
		}
		options = &RequestOptions{
			Cache:   opts["cache"] == true,
			Body:    opts["body"],
			Headers: reqHeaders,
			URL:     reqUrl,
		}
	case *RequestOptions:
		options = opts
	default:
		return nil, errors.New("invalid options provided to web integration")
	}

	fullURL := goutils.SafeJoinStrings([]string{wic.integration.BaseURL, options.URL}, "/")

	// TODO: Convert to using Redis cache, and support cache invalidation
	if options.Cache {
		cachedBody, gotCachedBody := localcache.GetCacheEntry(webRequestBody, fullURL)
		cachedContentType, gotCachedContentType := localcache.GetCacheEntry(webRequestContentType, fullURL)
		if gotCachedBody && gotCachedContentType {
			// Attempt to parse the response body into a structured representation,
			// if possible. If it fails, just return the raw response as a string
			return ParseResponseBody(cachedContentType.(string), cachedBody.([]byte), options.ResponseData)
		}
	}

	credsInterfaceMap := wic.credentials.GetInterfaceMap()

	var payloadReader io.Reader
	if options.Body != nil {
		switch payload := options.Body.(type) {
		case string:
			payloadReader = strings.NewReader(payload)
		case []byte:
			payloadReader = bytes.NewReader(payload)
		case map[string]interface{}:
			// Marshall other payloads, e.g. map[string]interface{} (almost certainly coming from Uesio) to JSON
			jsonBytes, err := json.Marshal(payload)
			if err != nil {
				return nil, errors.New("unable to serialize payload into JSON")
			}
			payloadReader = bytes.NewReader(jsonBytes)
		}
		if payloadReader == nil {
			return nil, errors.New("unexpected payload format for " + methodName + " request")
		}
	}

	req, err := http.NewRequest(methodName, fullURL, payloadReader)
	if err != nil {
		return nil, err
	}

	allHeaders := map[string]string{}

	if len(wic.integration.Headers) > 0 {
		for header, value := range wic.integration.Headers {
			allHeaders[header] = value
		}
	}
	if len(options.Headers) > 0 {
		for header, value := range options.Headers {
			allHeaders[header] = value
		}
	}
	for header, value := range allHeaders {
		template, err := templating.NewTemplateWithValidKeysOnly(value)
		if err != nil {
			return nil, err
		}
		mergedValue, err := templating.Execute(template, credsInterfaceMap)
		if err != nil {
			return nil, err
		}
		req.Header.Set(header, mergedValue)
	}

	resp, err := httpClient.Get().Do(req)
	if err != nil {
		return nil, err
	}
	if resp.Body != nil {
		defer resp.Body.Close()
	}

	if resp.StatusCode != 200 {
		responseData, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}
		return nil, errors.New(string(responseData))
	}

	if err != nil {
		return nil, err
	}

	// Read the full body into a byte array, so we can cache / parse
	rawData, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, errors.New("unparseable response body: " + err.Error())
	}

	contentType := resp.Header.Get("Content-Type")

	if options.Cache {
		localcache.SetCacheEntry(webRequestBody, fullURL, rawData)
		localcache.SetCacheEntry(webRequestContentType, fullURL, contentType)
	}

	// Attempt to parse the response body into a structured representation,
	// if possible. If it fails, just return the raw response as a string
	return ParseResponseBody(contentType, rawData, options.ResponseData)

}

// This function has two returns one if responseBody is not nil to be used by GO
// and the other one if it is to be used by TS/JS the first returned argument
func ParseResponseBody(contentType string, rawBody []byte, responseBody interface{}) (interface{}, error) {

	// We have some hacky code to support ClickUp which passes in the responseBody as a struct,
	// so that we can deserialize directly into ClickUp specific structs.
	// In these scenarios, responseBody will be non-nil.
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
			responseBody = &map[string]interface{}{}
		} else {
			// Otherwise, assume it's a JSON array
			responseBody = &[]interface{}{}
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

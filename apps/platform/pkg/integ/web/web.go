package web

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/goutils"
	httpClient "github.com/thecloudmasters/uesio/pkg/http"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

var responseCache cache.Cache[[]byte]
var contentTypeCache cache.Cache[string]

const (
	defaultExpiry  = time.Duration(20 * time.Minute)
	defaultCleanup = time.Duration(5 * time.Minute)
)

func init() {
	// Store previous responses in memory for no more than 20 minutes by default,
	// and reap expired entries every 5 minutes
	responseCache = cache.NewMemoryCache[[]byte](defaultExpiry, defaultCleanup)
	contentTypeCache = cache.NewMemoryCache[string](defaultExpiry, defaultCleanup)
}

type RequestOptions struct {
	URL          string            `json:"url"`
	Cache        bool              `json:"cache"`
	Headers      map[string]string `json:"headers"`
	Body         interface{}       `json:"body"`
	ResponseData interface{}
}

type connection struct {
	integration *meta.Integration
	credentials *adapt.Credentials
}

// TODO: ELIMINATE THE WEB INTEGRATION!
func RunAction(bot *meta.Bot, ic *adapt.IntegrationConnection, actionName string, params map[string]interface{}) (interface{}, error) {

	wic := &connection{
		integration: ic.GetIntegration(),
		credentials: ic.GetCredentials(),
	}

	switch strings.ToLower(actionName) {
	case "get", "post", "put", "patch", "delete":
		// TODO: Validate request options somehow
		result, err := wic.request(strings.ToUpper(actionName), params)
		if err != nil {
			return nil, err
		}
		return result, nil
	}

	return nil, errors.New("invalid action name for web integration")

}

func (wic *connection) request(methodName string, requestOptions interface{}) (interface{}, error) {
	var options *RequestOptions
	var responseData interface{}
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
		if responseDataType, hasKey := opts["responseData"]; hasKey {
			responseData = responseDataType
		}
		options = &RequestOptions{
			Cache:        opts["cache"] == true,
			Body:         opts["body"],
			Headers:      reqHeaders,
			URL:          reqUrl,
			ResponseData: responseData,
		}
	case *RequestOptions:
		options = opts
	default:
		return nil, errors.New("invalid options provided to web integration")
	}

	fullURL := goutils.SafeJoinStrings([]string{wic.integration.BaseURL, options.URL}, "/")

	// TODO: Support cache invalidation
	if options.Cache {
		cachedBody, _ := responseCache.Get(fullURL)
		cachedContentType, _ := contentTypeCache.Get(fullURL)
		if cachedBody != nil && cachedContentType != "" {
			// Attempt to parse the response body into a structured representation,
			// if possible. If it fails, just return the raw response as a string
			return ParseResponseBody(cachedContentType, cachedBody, options.ResponseData)
		}
	}

	var credsInterfaceMap map[string]interface{}
	if wic.credentials != nil {
		credsInterfaceMap = wic.credentials.GetInterfaceMap()
	} else {
		credsInterfaceMap = map[string]interface{}{}
	}

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
		responseCache.Set(fullURL, rawData)
		contentTypeCache.Set(fullURL, contentType)
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

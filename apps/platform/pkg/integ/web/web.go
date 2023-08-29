package web

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/thecloudmasters/uesio/pkg/creds"
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

type WebApiSchema struct {
	Reference  string             `json:"ref"`
	Type       string             `json:"type"`
	Properties []*WebApiParameter `json:"properties"`
}

type WebApiPayload struct {
	Description  string                   `json:"description"`
	ContentTypes map[string]*WebApiSchema `json:"contentTypes"`
}

type SchemaProperty struct {
	Type   string   `json:"type"`
	Enum   []string `json:"enum"`
	Format string   `json:"format"`
}

type WebApiParameter struct {
	Name     string        `json:"name"`
	Location string        `json:"in"`
	Required bool          `json:"required"`
	Schema   *WebApiSchema `json:"schema"`
}

type WebApiOperation struct {
	Name    string            `json:"name"`
	Method  string            `json:"method"`
	Path    string            `json:"path"`
	Headers map[string]string `json:"headers"`
	// Map from response code (e.g. "200", "400") to struct defining schemas by content type
	ResponseTypes map[string]*WebApiPayload `json:"responses"`
	// Define the different potential payloads by content type
	RequestBody *WebApiPayload     `json:"requestBody"`
	Parameters  []*WebApiParameter `json:"parameters"`
}

type WebDataSourceCustomMetadata struct {
	CommonRequestDetails *CommonRequestDetails       `json:"commonRequestDetails"`
	Operations           map[string]*WebApiOperation `json:"operations"`
	Schemas              map[string]*WebApiSchema    `json:"schemas"`
}

func (m *WebDataSourceCustomMetadata) GetOperationById(operationId string) *WebApiOperation {
	if m.Operations == nil {
		return nil
	}
	return m.Operations[operationId]
}
func (m *WebDataSourceCustomMetadata) GetSchemaById(schemaId string) *WebApiSchema {
	if m.Schemas == nil {
		return nil
	}
	return m.Schemas[schemaId]
}

func GetConnection(dataSource *meta.DataSource, session *sess.Session) (integ.IntegrationConnection, error) {

	// Parse custom metadata into our struct
	customMetadata := &WebDataSourceCustomMetadata{}

	err := json.Unmarshal([]byte(dataSource.CustomMetadata), customMetadata)
	if err != nil {
		return nil, fmt.Errorf("invalid custom metadata for data source %s", dataSource.Name)
	}

	credentials, err := creds.GetCredentials(dataSource.Credentials, session)
	if err != nil {
		return nil, fmt.Errorf("unable to load credentials for data source %s", dataSource.Name)
	}

	return &WebIntegrationConnection{
		session:              session,
		commonRequestDetails: customMetadata.CommonRequestDetails,
		credentials:          credentials,
	}, nil
}

func (wi *WebIntegration) GetIntegrationConnection(integration *meta.Integration, session *sess.Session, credentials *adapt.Credentials) (integ.IntegrationConnection, error) {
	return &WebIntegrationConnection{
		session:              session,
		commonRequestDetails: NewCommonRequestDetails(integration),
		credentials:          credentials,
	}, nil
}

type CommonRequestDetails struct {
	BaseUrl string
	Headers map[string]string
}

func NewCommonRequestDetails(integration *meta.Integration) *CommonRequestDetails {
	return &CommonRequestDetails{
		BaseUrl: integration.BaseURL,
		Headers: integration.Headers,
	}
}

type WebIntegrationConnection struct {
	session              *sess.Session
	commonRequestDetails *CommonRequestDetails
	credentials          *adapt.Credentials
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

	fullURL := goutils.SafeJoinStrings([]string{wic.commonRequestDetails.BaseUrl, options.URL}, "/")

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

	if len(wic.commonRequestDetails.Headers) > 0 {
		for header, value := range wic.commonRequestDetails.Headers {
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

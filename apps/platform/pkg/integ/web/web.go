package web

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/integ"
	"github.com/thecloudmasters/uesio/pkg/localcache"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

type RequestOptions struct {
	URL          string      `json:"url"`
	Cache        bool        `json:"cache"`
	Body         interface{} `json:"body"`
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

func SafeJoinStrings(elems []string, delimiter string) string {
	parts := make([]string, len(elems))
	for i, elem := range elems {
		parts[i] = strings.TrimSuffix(strings.TrimPrefix(elem, delimiter), delimiter)
	}
	return strings.Join(parts, delimiter)
}

func (wic *WebIntegrationConnection) Request(methodName string, requestOptions interface{}) (interface{}, error) {
	var options RequestOptions
	options, ok := requestOptions.(RequestOptions)
	// TODO: From BOTs, requestOptions is a map[string]interface{}, so handle that common case somehow...
	if !ok {
		// Do the unmarshall/marshall roundtrip to get the options we want.
		//TODO MUST BE a more efficient way, we don't want to marshall/unmarshall a payload!!!!
		serialized, err := json.Marshal(requestOptions)
		if err != nil {
			return nil, errors.New("invalid options provided to web integration")
		}
		if err = json.Unmarshal(serialized, &options); err != nil {
			return nil, errors.New("invalid options provided to web integration")
		}
	}

	fullURL := SafeJoinStrings([]string{wic.integration.BaseURL, options.URL}, "/")

	if options.Cache {
		cachedBody, gotCachedBody := localcache.GetCacheEntry(webRequestBody, fullURL)
		cachedContentType, gotCachedContentType := localcache.GetCacheEntry(webRequestContentType, fullURL)
		if gotCachedBody && gotCachedContentType {
			// Attempt to parse the response body into a structured representation,
			// if possible. If it fails, just return the raw response as a string
			parsedBody, err := parseResponseBody(cachedContentType.(string), bytes.NewReader(cachedBody.([]byte)))
			// If this fails, try the request again, otherwise use the body
			if err != nil {
				options.ResponseData = parsedBody
				return options.ResponseData, nil
			}
		}
	}

	credsInterfaceMap := wic.credentials.GetInterfaceMap()

	var payloadReader io.Reader
	if options.Body != nil {
		payloadReader = bytes.NewReader(options.Body.([]byte))
	}

	req, err := http.NewRequest(methodName, fullURL, payloadReader)
	if err != nil {
		return nil, err
	}

	for header, value := range wic.integration.Headers {
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

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

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
		return nil, err
	}

	// Attempt to parse the response body into a structured representation,
	// if possible. If it fails, just return the raw response as a string
	parsedBody, err := parseResponseBody(contentType, bytes.NewReader(rawData))
	if err != nil {
		return nil, err
	}
	options.ResponseData = parsedBody
	return options.ResponseData, nil
}

func parseResponseBody(contentType string, body io.Reader) (interface{}, error) {

	// Only parse as JSON to a structured Go type if that's what the content type is.
	if strings.Contains(contentType, "/json") {
		// First try parsing as a JSON map
		mapPtr := &map[string]interface{}{}
		err := json.NewDecoder(body).Decode(mapPtr)
		if err == nil {
			return mapPtr, nil
		}
		// Next try parsing as a JSON array (of something)
		slicePtr := &[]interface{}{}
		err = json.NewDecoder(body).Decode(&slicePtr)
		if err == nil {
			return slicePtr, nil
		}
	}
	// Otherwise, just return the raw data as a string
	rawData, err := io.ReadAll(body)
	if err != nil {
		return nil, errors.New("received unreadable response body")
	}
	return string(rawData), nil

}

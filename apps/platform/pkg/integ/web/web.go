package web

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/integ"
	"github.com/thecloudmasters/uesio/pkg/localcache"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

type GetActionOptions struct {
	URL          string
	Cache        bool
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

func (wic *WebIntegrationConnection) RunAction(actionName string, requestOptions interface{}) (interface{}, error) {

	switch actionName {
	case "get":
		return nil, wic.Get(requestOptions)
	}

	return nil, errors.New("Invalid Action Name for Web Integration")

}

func (wic *WebIntegrationConnection) Get(requestOptions interface{}) error {
	options, ok := requestOptions.(*GetActionOptions)
	if !ok {
		return errors.New("Invalid options provided to web integration")
	}

	fullURL := fmt.Sprintf("%s/%s", wic.integration.BaseURL, options.URL)

	if options.Cache {
		cachedResponse, gotCache := localcache.GetCacheEntry("web-request", fullURL)
		if gotCache {
			return json.Unmarshal(cachedResponse.([]byte), options.ResponseData)
		}
	}

	credsInterfaceMap := wic.credentials.GetInterfaceMap()

	req, err := http.NewRequest("GET", fullURL, nil)
	if err != nil {
		return err
	}

	for header, value := range wic.integration.Headers {
		template, err := templating.NewTemplateWithValidKeysOnly(value)
		if err != nil {
			return err
		}
		mergedValue, err := templating.Execute(template, credsInterfaceMap)
		if err != nil {
			return err
		}
		req.Header.Set(header, mergedValue)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		responseData, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return err
		}
		return errors.New(string(responseData))
	}

	if options.Cache {
		err := json.NewDecoder(resp.Body).Decode(options.ResponseData)
		if err != nil {
			return err
		}
		dataToCache, err := json.Marshal(options.ResponseData)
		if err != nil {
			return err
		}
		localcache.SetCacheEntry("web-request", fullURL, dataToCache)
		return nil
	}

	return json.NewDecoder(resp.Body).Decode(options.ResponseData)
}

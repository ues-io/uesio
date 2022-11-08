package web

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/integ"
	"github.com/thecloudmasters/uesio/pkg/localcache"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

type WebIntegration struct{}

func (wi *WebIntegration) Exec(options *integ.IntegrationOptions, requestData, responseData interface{}, integration *meta.Integration, session *sess.Session) error {

	fullURL := fmt.Sprintf("%s/%s", integration.BaseURL, options.URL)

	if options.Cache {
		cachedResponse, gotCache := localcache.GetCacheEntry("web-request", fullURL)
		if gotCache {
			return json.Unmarshal(cachedResponse.([]byte), responseData)
		}
	}

	credentials, err := creds.GetCredentials(integration.Credentials, session)
	if err != nil {
		return err
	}

	credsInterfaceMap := credentials.GetInterfaceMap()

	req, err := http.NewRequest("GET", fullURL, nil)
	if err != nil {
		return err
	}

	for header, value := range integration.Headers {
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
		err := json.NewDecoder(resp.Body).Decode(responseData)
		if err != nil {
			return err
		}
		dataToCache, err := json.Marshal(responseData)
		if err != nil {
			return err
		}
		localcache.SetCacheEntry("web-request", fullURL, dataToCache)
		return nil
	}

	return json.NewDecoder(resp.Body).Decode(responseData)
}

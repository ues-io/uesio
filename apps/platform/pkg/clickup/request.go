package clickup

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/localcache"
)

// GET teams
// https://api.clickup.com/api/v2/team
// TEAM ID: 2569646 --- The Cloud Masters

// GET spaces
// https://api.clickup.com/api/v2/team/{team_id}/space?archived=false
// SPACE ID: 8863869 --- AMAZON Management

// GET folders
// https://api.clickup.com/api/v2/space/{space_id}/folder?archived=false

var BASE_URL = "https://api.clickup.com/api/v2"

func makeRequest(data interface{}, url string) error {

	fullURL := fmt.Sprintf("%s/%s", BASE_URL, url)

	cachedResponse, gotCache := localcache.GetCacheEntry("web-request", fullURL)
	if gotCache {
		return json.Unmarshal(cachedResponse.([]byte), data)
	}

	req, err := http.NewRequest("GET", fullURL, nil)
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "pk_4678167_P5EKGGXNY3DXIB08U5CWL98HD14VST19")
	req.Header.Set("Content-Type", "application/json")
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

	if !gotCache {
		err := json.NewDecoder(resp.Body).Decode(data)
		if err != nil {
			return err
		}
		dataToCache, err := json.Marshal(data)
		if err != nil {
			return err
		}
		localcache.SetCacheEntry("web-request", fullURL, dataToCache)
		return nil
	}

	return json.NewDecoder(resp.Body).Decode(data)

}

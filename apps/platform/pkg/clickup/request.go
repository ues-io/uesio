package clickup

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
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

	fmt.Println(fullURL)

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
		data, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return err
		}
		return errors.New(string(data))
	}

	return json.NewDecoder(resp.Body).Decode(data)

}

package call

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/thecloudmasters/clio/pkg/config/host"
)

func Request(method, url string, body io.Reader, sessid string) (*http.Response, error) {

	host, err := host.GetHostPrompt()
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(method, fmt.Sprintf("%s/%s", host, url), body)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Cookie", "sessid="+sessid)
	return http.DefaultClient.Do(req)
}

func GetJSON(url, sessid string, response interface{}) error {
	resp, err := Request("GET", url, nil, sessid)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return json.NewDecoder(resp.Body).Decode(response)
}

func PostJSON(url, sessid string, request interface{}, response interface{}) error {

	payloadBytes := &bytes.Buffer{}

	err := json.NewEncoder(payloadBytes).Encode(request)
	if err != nil {
		return err
	}

	resp, err := Request("POST", url, payloadBytes, sessid)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return json.NewDecoder(resp.Body).Decode(response)

}

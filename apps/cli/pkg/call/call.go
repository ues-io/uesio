package call

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/thecloudmasters/cli/pkg/config/host"
	"github.com/thecloudmasters/cli/pkg/context"
)

func Request(method, url string, body io.Reader, sessionId string, appContext *context.AppContext) (*http.Response, error) {

	hostName, err := host.GetHostPrompt()
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(method, fmt.Sprintf("%s/%s", hostName, url), body)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Cookie", "sessid="+sessionId)
	if appContext != nil {
		appContext.AddHeadersToRequest(req)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		data, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}
		resp.Body.Close()
		return nil, errors.New(string(data))
	}
	// Check for a Location header, indicating we need to redirect.
	// This likely represents an error, such as the user being logged out
	if locationHeader := resp.Header.Get("Location"); strings.Contains(locationHeader, "/login") {
		return nil, errors.New("Unable to access the requested resource. Please run `uesio status` to verify that you are logged in as a user with access to this app.")
	}
	return resp, nil
}

func GetJSON(url, sessionId string, response interface{}) error {
	resp, err := Request("GET", url, nil, sessionId, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return json.NewDecoder(resp.Body).Decode(response)
}

func Delete(url, sessionId string, appContext *context.AppContext) (int, error) {
	resp, err := Request("DELETE", url, nil, sessionId, appContext)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	return resp.StatusCode, nil
}

func PostJSON(url, sessionId string, request, response interface{}, appContext *context.AppContext) error {

	payloadBytes := &bytes.Buffer{}

	err := json.NewEncoder(payloadBytes).Encode(request)
	if err != nil {
		return err
	}

	resp, err := Request("POST", url, payloadBytes, sessionId, appContext)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return json.NewDecoder(resp.Body).Decode(response)

}

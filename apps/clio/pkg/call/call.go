package call

import (
	"fmt"
	"io"
	"net/http"

	"github.com/thecloudmasters/clio/pkg/config"
)

func Request(method, url string, body io.Reader, sessid string) (*http.Response, error) {

	host, err := config.GetHostPrompt()
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

package call

import (
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

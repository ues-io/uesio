package call

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/thecloudmasters/cli/pkg/config/host"
	appcontext "github.com/thecloudmasters/cli/pkg/context"
	uesiohttp "github.com/thecloudmasters/uesio/pkg/http"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

type RequestSpec struct {
	Method            string
	Url               string
	Token             string
	AppContext        *appcontext.AppContext
	Body              io.Reader
	AdditionalHeaders map[string]string
}

type ResultReader[K any] func(io.Reader) (K, error)

// TODO: The way that http client is created and used throughout the code
// base needs to be evaluated. In the CLI itself, this isn't as much of a
// concern vs. the platform but the CLI should be contemplated in the
// evaluation nonetheless. See https://github.com/ues-io/uesio/issues/4781
var useioClient = uesiohttp.NewLocalhostClient()

func Request(r *RequestSpec) (*http.Response, error) {

	hostName, err := host.GetHostPrompt()
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(context.Background(), r.Method, fmt.Sprintf("%s/%s", hostName, r.Url), r.Body)
	if err != nil {
		return nil, err
	}

	if r.Token != "" {
		req.Header.Set("Cookie", middleware.BrowserSessionCookieName+"="+r.Token)
	}
	if r.AppContext != nil {
		r.AppContext.AddHeadersToRequest(req)
	}
	if r.AdditionalHeaders != nil {
		for headerName, headerValue := range r.AdditionalHeaders {
			req.Header.Set(headerName, headerValue)
		}
	}

	resp, err := useioClient.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		defer resp.Body.Close()
		data, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		switch resp.StatusCode {
		case http.StatusNotFound:
			return nil, exceptions.NewNotFoundException("resource not found")
		case http.StatusForbidden, http.StatusUnauthorized:
			return nil, exceptions.NewForbiddenException(string(data))
		case http.StatusBadRequest:
			// intentionally not using NewBadRequestException here because the data already contains the text "bad request: ..." and using
			// BadRequestException again would emit "bad request:" twice.
			// TODO: Consider BadRequestException not prefixing the message with "bad request:"
			return nil, errors.New(string(data))
		default:
			return nil, fmt.Errorf("request to %v failed with status code %v: '%v'", resp.Request.URL, resp.StatusCode, string(data))
		}
	}
	// Check for a Location header, indicating we need to redirect.
	// This likely represents an error, such as the user being logged out
	if locationHeader := resp.Header.Get("Location"); strings.Contains(locationHeader, "/login") {
		defer resp.Body.Close()
		return nil, errors.New("unable to access the requested resource, please run `uesio status` to verify that you are logged in as a user with access to this app")
	}
	return resp, nil
}

func RequestResult[K any](req *RequestSpec, read ResultReader[K]) (K, error) {
	var result K
	resp, err := Request(req)
	if err != nil {
		return result, err
	}
	defer resp.Body.Close()

	result, err = read(resp.Body)
	if err != nil {
		return result, err
	}

	if err := checkStatus(resp); err != nil {
		return result, err
	}

	return result, nil
}

func GetJSON(url, token string, response any) error {
	_, err := RequestResult(&RequestSpec{
		Method: http.MethodGet,
		Url:    url,
		Token:  token,
	}, JSONResultReader(response))
	if err != nil {
		return err
	}
	return nil
}

func Delete(url, token string, appContext *appcontext.AppContext) (int, error) {
	resp, err := Request(&RequestSpec{
		Method:     http.MethodDelete,
		Url:        url,
		Token:      token,
		AppContext: appContext,
	})
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	return resp.StatusCode, nil
}

func Post(url string, payload io.Reader, token string, appContext *appcontext.AppContext) (*http.Response, error) {
	return Request(&RequestSpec{
		Method:     http.MethodPost,
		Url:        url,
		Body:       payload,
		Token:      token,
		AppContext: appContext,
	})
}

func PostForm(url string, payload io.Reader, token string, appContext *appcontext.AppContext) (*http.Response, error) {
	return Request(&RequestSpec{
		Method:     http.MethodPost,
		Url:        url,
		Body:       payload,
		Token:      token,
		AppContext: appContext,
		AdditionalHeaders: map[string]string{
			"Content-Type": "application/x-www-form-urlencoded",
		},
	})
}

func PostJSON(url, token string, request, response any, appContext *appcontext.AppContext) error {

	payloadBytes := &bytes.Buffer{}

	if err := json.NewEncoder(payloadBytes).Encode(request); err != nil {
		return err
	}

	_, err := RequestResult(&RequestSpec{
		Method:     http.MethodPost,
		Url:        url,
		Body:       payloadBytes,
		Token:      token,
		AppContext: appContext,
	}, JSONResultReader(response))

	if err != nil {
		return err
	}
	return nil
}

func PostBytes(url string, payload io.Reader, token string, appContext *appcontext.AppContext) ([]byte, error) {
	return RequestResult(&RequestSpec{
		Method:     http.MethodPost,
		Url:        url,
		Body:       payload,
		Token:      token,
		AppContext: appContext,
	}, ByteResultReader)
}

func ByteResultReader(body io.Reader) ([]byte, error) {
	return io.ReadAll(body)
}

func JSONResultReader[K any](result K) ResultReader[K] {
	return func(body io.Reader) (K, error) {
		err := json.NewDecoder(body).Decode(result)
		if err != nil {
			return result, err
		}
		return result, nil
	}
}

func checkStatus(resp *http.Response) error {
	status := resp.Trailer.Get(uesiohttp.TRAILER_UESIO_STATUS_CODE_KEY)
	if status != "" && status != uesiohttp.TRAILER_UESIO_STATUS_CODE_SUCCESS {
		message := resp.Trailer.Get(uesiohttp.TRAILER_UESIO_STATUS_MESSAGE_KEY)
		if message == "" {
			message = "an unknown error occurred"
		}
		return fmt.Errorf("encountered error on server: %s", message)
	}

	return nil
}

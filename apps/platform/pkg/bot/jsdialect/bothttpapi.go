package jsdialect

import (
	"bytes"
	"encoding/json"
	"errors"
	httpClient "github.com/thecloudmasters/uesio/pkg/http"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"io"
	"net/http"
	"strings"
)

type BotHttpAPI struct {
	bot     *meta.Bot
	session *sess.Session
}

func NewBotHttpAPI(bot *meta.Bot, session *sess.Session) *BotHttpAPI {
	return &BotHttpAPI{
		bot:     bot,
		session: session,
	}
}

type BotHttpRequest struct {
	Headers map[string]string `json:"headers" bot:"headers"`
	Method  string            `json:"method" bot:"method"`
	URL     string            `json:"url" bot:"url"`
	Body    interface{}       `json:"body" bot:"body"`
}

type BotHttpResponse struct {
	Headers map[string]string `json:"headers" bot:"headers"`
	Code    int               `json:"code" bot:"code"`
	Status  string            `json:"status" bot:"status"`
	Body    interface{}       `json:"body" bot:"body"`
}

func BadRequest(message string) *BotHttpResponse {
	statusText := http.StatusText(http.StatusBadRequest)
	return &BotHttpResponse{
		Code:    http.StatusBadRequest,
		Status:  statusText,
		Headers: map[string]string{},
		Body: map[string]string{
			"error":  message,
			"status": statusText,
		},
	}
}

func ServerError(err error) *BotHttpResponse {
	logger.LogError(err)
	statusText := http.StatusText(http.StatusInternalServerError)
	return &BotHttpResponse{
		Code:    http.StatusInternalServerError,
		Status:  statusText,
		Headers: map[string]string{},
		Body: map[string]string{
			"status": statusText,
		},
	}
}

func (api *BotHttpAPI) Request(req *BotHttpRequest) *BotHttpResponse {

	var payloadReader io.Reader
	if req.Body != nil {
		switch payload := req.Body.(type) {
		case string:
			payloadReader = strings.NewReader(payload)
		case []byte:
			payloadReader = bytes.NewReader(payload)
		case map[string]interface{}:
			// Marshall other payloads, e.g. map[string]interface{} (almost certainly coming from Uesio) to JSON
			jsonBytes, err := json.Marshal(payload)
			if err != nil {
				return BadRequest("unable to serialize payload into JSON")
			}
			payloadReader = bytes.NewReader(jsonBytes)
		}
		if payloadReader == nil {
			return BadRequest("unexpected payload format for " + req.Method + " request")
		}
	}

	httpReq, err := http.NewRequest(req.Method, req.URL, payloadReader)
	if err != nil {
		return ServerError(err)
	}
	if len(req.Headers) > 0 {
		for header, value := range req.Headers {
			httpReq.Header.Set(header, value)
		}
	}

	httpResp, err := httpClient.Get().Do(httpReq)
	if err != nil {
		return ServerError(err)
	}
	defer httpResp.Body.Close()

	// Read the full body into a byte array, so we can cache / parse
	responseData, responseError := io.ReadAll(httpResp.Body)
	if responseError != nil {
		return ServerError(errors.New("unable to read response body: " + responseError.Error()))
	}

	contentType := httpResp.Header.Get("Content-Type")

	// Attempt to parse the response body into a structured representation,
	// if possible. If it fails, just return the raw response as a string
	parsedBody, err := parseResponseBody(contentType, responseData)
	if err != nil {
		return &BotHttpResponse{
			Headers: getBotHeaders(httpResp.Header),
			Code:    httpResp.StatusCode,
			Status:  httpResp.Status,
			Body:    string(responseData),
		}
	}
	return &BotHttpResponse{
		Headers: getBotHeaders(httpResp.Header),
		Code:    httpResp.StatusCode,
		Status:  httpResp.Status,
		Body:    parsedBody,
	}
}

func getBotHeaders(header http.Header) map[string]string {
	headers := map[string]string{}
	for k := range header {
		headers[k] = header.Get(k)
	}
	return headers
}

func parseResponseBody(contentType string, body []byte) (interface{}, error) {

	// Only parse as JSON to a structured Go type if that's what the content type is.
	if strings.Contains(contentType, "/json") {
		// If it starts with a curly brace, treat it as JSON object
		if string(body[0]) == "{" {
			mapPtr := &map[string]interface{}{}
			err := json.NewDecoder(bytes.NewReader(body)).Decode(mapPtr)
			if err == nil {
				return mapPtr, nil
			}
		} else {
			// Otherwise, assume it's a JSON array
			slicePtr := &[]interface{}{}
			err := json.NewDecoder(bytes.NewReader(body)).Decode(&slicePtr)
			if err == nil {
				return slicePtr, nil
			}
		}
	}
	// Otherwise, just return the raw data as a string
	return string(body), nil
}

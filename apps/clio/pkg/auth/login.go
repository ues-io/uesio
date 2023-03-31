package auth

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"os"

	"github.com/AlecAivazis/survey/v2"
	"github.com/thecloudmasters/clio/pkg/call"
	"github.com/thecloudmasters/clio/pkg/config"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/routing"
)

var MockUserNames = []string{"ben", "abel", "wessel", "baxter", "zach", "uesio"}

type LoginHandler func() (map[string]string, error)

type LoginMethodHandler struct {
	Key     string
	Label   string
	Handler LoginHandler
}

var mockHandler = &LoginMethodHandler{
	Key:   "uesio/core.mock",
	Label: "Mock login",
	Handler: func() (map[string]string, error) {
		username := os.Getenv("UESIO_CLI_USERNAME")
		if username == "" {
			err := survey.AskOne(&survey.Select{
				Message: "Select a user.",
				Options: MockUserNames,
			}, &username)
			if err != nil {
				return nil, err
			}
		}
		return map[string]string{
			"token": "{\"subject\":\"" + username + "\"}",
		}, nil
	},
}

var platformHandler = &LoginMethodHandler{
	Key:   "uesio/core.platform",
	Label: "Sign in with username",
	Handler: func() (map[string]string, error) {
		username := os.Getenv("UESIO_CLI_USERNAME")
		password := os.Getenv("UESIO_CLI_PASSWORD")

		if username == "" {
			usernameErr := survey.AskOne(&survey.Input{
				Message: "Username",
			}, &username)
			if usernameErr != nil {
				return nil, usernameErr
			}
		}
		if password == "" {
			pwErr := survey.AskOne(&survey.Password{
				Message: "Password",
			}, &password)
			if pwErr != nil {
				return nil, pwErr
			}
		}
		return map[string]string{
			"username": username,
			"password": password,
		}, nil

	},
}

var loginHandlers = []*LoginMethodHandler{mockHandler, platformHandler}

func getHandlerOptions() []string {
	options := make([]string, len(loginHandlers))
	for i, handler := range loginHandlers {
		options[i] = handler.Label
	}
	return options
}

func getHandlerByKey(key string) *LoginMethodHandler {
	for _, handler := range loginHandlers {
		if handler.Key == key {
			return handler
		}
	}
	return nil
}
func getHandlerByLabel(label string) *LoginMethodHandler {
	for _, handler := range loginHandlers {
		if handler.Label == label {
			return handler
		}
	}
	return nil
}

func getLoginPayload() (string, map[string]string, error) {
	loginMethod := os.Getenv("UESIO_CLI_LOGIN_METHOD")
	var handler *LoginMethodHandler
	if loginMethod == "" {
		err := survey.AskOne(&survey.Select{
			Message: "Select a login method.",
			Options: getHandlerOptions(),
		}, &loginMethod)
		if err != nil {
			return "", nil, err
		}
		handler = getHandlerByLabel(loginMethod)
	} else {
		handler = getHandlerByKey(loginMethod)
	}

	if handler == nil {
		return "", nil, errors.New("Invalid Login Method")
	}

	payload, err := handler.Handler()
	if err != nil {
		return "", nil, err
	}

	return handler.Key, payload, nil

}

func Login() (*routing.UserMergeData, error) {

	// First check to see if you're already logged in
	currentUser, err := Check()
	if err != nil {
		return nil, err
	}

	if currentUser.Profile == "uesio/studio.standard" {
		return currentUser, nil
	}

	method, payload, err := getLoginPayload()
	if err != nil {
		return nil, err
	}

	methodNamespace, methodName, err := meta.ParseKey(method)
	if err != nil {
		return nil, err
	}

	payloadBytes := &bytes.Buffer{}

	err = json.NewEncoder(payloadBytes).Encode(&payload)
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("site/auth/%s/%s/login", methodNamespace, methodName)

	resp, err := call.Request("POST", url, payloadBytes, "")
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	userResponse := &routing.LoginResponse{}

	err = json.NewDecoder(resp.Body).Decode(&userResponse)
	if err != nil {
		return nil, err
	}

	sessid := ""

	for _, cookie := range resp.Cookies() {
		if cookie.Name == "sessid" {
			sessid = cookie.Value
			break
		}
	}

	if sessid == "" {
		return nil, errors.New("No cookie found in login response")
	}

	err = config.SetSessionID(sessid)
	if err != nil {
		return nil, err
	}

	return userResponse.User, nil

}

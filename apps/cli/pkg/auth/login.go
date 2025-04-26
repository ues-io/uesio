package auth

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/AlecAivazis/survey/v2"

	"github.com/thecloudmasters/cli/pkg/call"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/cli/pkg/wire"
)

type LoginHandler func() (map[string]string, error)

type LoginMethodHandler struct {
	Key     string
	Label   string
	Handler LoginHandler
}

func parseKey(key string) (string, string, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return "", "", fmt.Errorf("invalid key: %s", key)
	}
	return keyArray[0], keyArray[1], nil
}

func getMockHandler() (*LoginMethodHandler, error) {

	// Check to see if any mock logins exist.
	users, err := wire.GetMockUsers()
	if err != nil {
		// For backwards compatibility just ignore the error here
		// and continue witout allowing mock login
		return nil, nil
	}

	if users.Len() == 0 {
		return nil, nil
	}

	mockUserNames := []string{}

	for _, user := range users {
		username, err := user.GetFieldAsString("uesio/appkit.username")
		if err != nil {
			return nil, err
		}
		mockUserNames = append(mockUserNames, username)
	}

	return &LoginMethodHandler{
		Key:   "uesio/core.mock",
		Label: "Mock login",
		Handler: func() (map[string]string, error) {
			username := os.Getenv("UESIO_CLI_USERNAME")
			if username == "" {
				err := survey.AskOne(&survey.Select{
					Message: "Select a user.",
					Options: mockUserNames,
				}, &username)
				if err != nil {
					return nil, err
				}
			}
			return map[string]string{
				"token": username,
			}, nil
		},
	}, nil

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

func getHandlerOptions(loginHandlers []*LoginMethodHandler) []string {
	options := make([]string, len(loginHandlers))
	for i, handler := range loginHandlers {
		options[i] = handler.Label
	}
	return options
}

func getHandlerByKey(key string, loginHandlers []*LoginMethodHandler) *LoginMethodHandler {
	for _, handler := range loginHandlers {
		if handler.Key == key {
			return handler
		}
	}
	return nil
}
func getHandlerByLabel(label string, loginHandlers []*LoginMethodHandler) *LoginMethodHandler {
	for _, handler := range loginHandlers {
		if handler.Label == label {
			return handler
		}
	}
	return nil
}

func getLoginPayload() (string, map[string]string, error) {

	var loginHandlers = []*LoginMethodHandler{platformHandler}

	var handler *LoginMethodHandler

	// Add in mock handler if relevant
	mockHandler, err := getMockHandler()
	if err != nil {
		return "", nil, err
	}
	if mockHandler != nil {
		// Prepend the mock handler so it's first.
		loginHandlers = append([]*LoginMethodHandler{mockHandler}, loginHandlers...)
	}

	loginMethodOptions := getHandlerOptions(loginHandlers)

	// If login method is specified via env vars, use that
	loginMethod := os.Getenv("UESIO_CLI_LOGIN_METHOD")
	if loginMethod != "" {
		handler = getHandlerByKey(loginMethod, loginHandlers)
	}
	// If only have one possible login method, just use that
	if handler == nil && len(loginMethodOptions) == 1 {
		handler = getHandlerByLabel(loginMethodOptions[0], loginHandlers)
	}
	// If we still don't have a login method, then we need to prompt
	if handler == nil {
		if err := survey.AskOne(&survey.Select{
			Message: "Select a login method.",
			Options: loginMethodOptions,
		}, &loginMethod); err != nil {
			return "", nil, err
		}
		handler = getHandlerByLabel(loginMethod, loginHandlers)
	}
	// If we still don't have a handler --- fail
	if handler == nil {
		return "", nil, errors.New("invalid login method")
	}

	payload, err := handler.Handler()
	if err != nil {
		return "", nil, err
	}

	return handler.Key, payload, nil

}

func Login() (*UserMergeData, error) {

	// First check to see if you're already logged in
	currentUser, err := Check()
	if err != nil {
		return nil, err
	}

	if currentUser != nil && (currentUser.Profile == "uesio/studio.standard" || currentUser.Profile == "uesio/studio.admin") {
		return currentUser, nil
	}

	method, payload, err := getLoginPayload()
	if err != nil {
		return nil, err
	}

	methodNamespace, methodName, err := parseKey(method)
	if err != nil {
		return nil, err
	}

	payloadBytes := &bytes.Buffer{}

	err = json.NewEncoder(payloadBytes).Encode(&payload)
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("site/auth/%s/%s/login", methodNamespace, methodName)

	resp, err := call.Post(url, payloadBytes, "", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	userResponse := &LoginResponse{}

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
		return nil, errors.New("no cookie found in login response")
	}

	err = config.SetSessionID(sessid)
	if err != nil {
		return nil, err
	}

	return userResponse.User, nil

}

package app

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/thecloudmasters/cli/pkg/auth"
	"github.com/thecloudmasters/cli/pkg/call"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/cli/pkg/param"
	"github.com/thecloudmasters/cli/pkg/wire"
	"github.com/thecloudmasters/cli/pkg/zip"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func getAnswerInfo(sessid string) (map[string]interface{}, error) {
	users, err := wire.GetAvailableUsernames()
	if err != nil {
		return nil, errors.New("Unable to retrieve users from studio")
	}

	return param.AskMany(&meta.BotParamsResponse{
		{
			Name:    "user",
			Prompt:  "Select user or organization",
			Choices: users,
			Type:    "LIST",
		},
		{
			Name:   "app",
			Prompt: "App Name (a-z, 0-9, or _ only)",
			Type:   "METADATANAME",
		},
		{
			Name:    "color",
			Prompt:  "Select a color",
			Choices: param.ACCENT_COLORS,
			Type:    "LIST",
		},
		{
			Name:    "shade",
			Prompt:  "Select a shade",
			Choices: param.SHADES,
			Type:    "LIST",
		},
		{
			Name:    "icon",
			Prompt:  "Select an icon",
			Choices: param.APP_ICONS,
			Type:    "LIST",
		},
	}, "", "", sessid)

}

func getAnswers(sessid string) (string, string, string, string, error) {
	answers, err := getAnswerInfo(sessid)
	if err != nil {
		return "", "", "", "", nil
	}
	username := answers["user"].(string)
	appname := answers["app"].(string)
	hue := answers["color"].(string)
	shade := answers["shade"].(string)
	icon := answers["icon"].(string)
	color := param.COLORS[hue][shade]
	return username, appname, color, icon, nil
}

func AppInit() error {

	// TODO: Only log this in verbose mode, and use a logging api
	fmt.Println("Running app:init command")

	_, err := auth.Login()
	if err != nil {
		return err
	}

	sessid, err := config.GetSessionID()
	if err != nil {
		return err
	}

	app, err := config.GetApp()
	if err != nil {

		// Create an app
		fmt.Println("No bundle info found. Let's create a new app.")
		username, appname, color, icon, err := getAnswers(sessid)
		if err != nil {
			return err
		}

		appdata, err := wire.CreateNewApp(username, appname, color, icon)
		if err != nil {
			return err
		}

		fullname := appdata["uesio/studio.fullname"].(string)

		app = fullname

		fmt.Println("Created App: " + fullname)
	}

	generateURL := "version/uesio/core/uesio/core/v0.0.1/metadata/generate/init"

	payloadBytes := &bytes.Buffer{}

	err = json.NewEncoder(payloadBytes).Encode(&map[string]string{"name": app})
	if err != nil {
		return err
	}
	resp, err := call.Request("POST", generateURL, payloadBytes, sessid)
	if err != nil {
		return err
	}

	err = zip.Unzip(resp.Body, "")
	if err != nil {
		return err
	}

	fmt.Println("Successfully created App")

	return nil
}

package command

import (
	"bytes"
	"encoding/json"
	"fmt"

	"github.com/thecloudmasters/clio/pkg/auth"
	"github.com/thecloudmasters/clio/pkg/call"
	"github.com/thecloudmasters/clio/pkg/config"
	"github.com/thecloudmasters/clio/pkg/param"
	"github.com/thecloudmasters/clio/pkg/wire"
	"github.com/thecloudmasters/clio/pkg/zip"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func getAnswerInfo(sessid string) (map[string]interface{}, error) {
	users, err := wire.Load("uesio/core.user", &wire.LoadOptions{
		Fields: []adapt.LoadRequestField{{
			ID: "uesio/core.username",
		}},
		RequireWriteAccess: true,
	})
	if err != nil {
		return nil, err
	}

	options := []string{}
	for _, user := range users {
		username, err := user.GetFieldAsString("uesio/core.username")
		if err != nil {
			return nil, err
		}
		options = append(options, username)
	}

	return param.AskMany(&meta.BotParams{
		{
			Name:    "user",
			Prompt:  "Select user or org",
			Choices: options,
			Type:    "LIST",
		},
		{
			Name:   "app",
			Prompt: "App Name",
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

func Initialize() error {

	fmt.Println("Running Initialize Command 5")

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

	fmt.Println("Init Success")

	return nil
}

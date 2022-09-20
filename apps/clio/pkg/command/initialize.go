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
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func Initialize() error {

	fmt.Println("Running Initialize Command 5")

	user, err := auth.Login()
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
		answers, err := param.AskMany(&meta.BotParams{
			{
				Name:   "user",
				Prompt: "Select User or Org",
				Choices: []string{
					user.Username,
				},
				Type: "LIST",
			},
			{
				Name:   "app",
				Prompt: "App Name",
				Type:   "METADATANAME",
			},
		}, app, "", sessid)
		if err != nil {
			return err
		}

		username := answers["user"].(string)
		appname := answers["app"].(string)

		appdata, err := wire.CreateNewApp(username, appname)
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

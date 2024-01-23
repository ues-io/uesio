package app

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/thecloudmasters/cli/pkg/auth"
	"github.com/thecloudmasters/cli/pkg/call"
	"github.com/thecloudmasters/cli/pkg/command/workspace"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/cli/pkg/config/ws"
	"github.com/thecloudmasters/cli/pkg/param"
	"github.com/thecloudmasters/cli/pkg/wire"
	"github.com/thecloudmasters/cli/pkg/zip"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func getAnswerInfo(sessid, existingAppName string) (map[string]interface{}, error) {
	users, err := wire.GetAvailableUsernames()
	if err != nil {
		return nil, errors.New("unable to retrieve users from studio")
	}

	botParams := meta.BotParamsResponse{}

	if existingAppName == "" {
		// Use the current directory as the default app name
		defaultAppName := ""
		wd, err := os.Getwd()
		if err == nil && wd != "" {
			wdParts := strings.Split(wd, string(filepath.Separator))
			defaultAppName = wdParts[len(wdParts)-1]
		}

		botParams = append(botParams, meta.BotParamResponse{
			Name:    "app",
			Prompt:  "App Name (a-z, 0-9, or _ only)",
			Type:    "METADATANAME",
			Default: defaultAppName,
		})
	}
	botParams = append(botParams, meta.BotParamResponse{
		Name:    "user",
		Prompt:  "Select user or organization",
		Choices: users,
		Type:    "LIST",
	},
		meta.BotParamResponse{
			Name:    "color",
			Prompt:  "Select a color",
			Choices: param.ACCENT_COLORS,
			Type:    "LIST",
		},
		meta.BotParamResponse{
			Name:    "shade",
			Prompt:  "Select a shade",
			Choices: param.SHADES,
			Type:    "LIST",
		},
		meta.BotParamResponse{
			Name:    "icon",
			Prompt:  "Select an icon",
			Choices: param.APP_ICONS,
			Type:    "LIST",
		},
	)

	answers, err := param.AskMany(&botParams, "", "", sessid)
	if err != nil {
		return nil, err
	}

	if existingAppName != "" {
		answers["app"] = existingAppName
	}

	return answers, err

}

func getAnswers(sessid, existingAppName string) (string, string, string, string, error) {
	answers, err := getAnswerInfo(sessid, existingAppName)
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

	_, err := auth.Login()
	if err != nil {
		return err
	}

	sessid, err := config.GetSessionID()
	if err != nil {
		return err
	}

	// See if there is already an app bundle.yaml in local filesystem
	appFullName, _ := config.GetApp()

	// Now, check to see if the app exists on Uesio server
	var appObject *wire.App
	if appFullName != "" {
		appObject, err = wire.GetApp()
		if err != nil && err.Error() != wire.ERROR_ZERO_RECORDS_FOR_LOAD_ONE {
			return err
		}
	}

	// If we do NOT have an app on the server, then we need to create an app
	if appObject == nil {

		existingAppName := ""

		if appFullName != "" {
			parts := strings.Split("/", appFullName)
			if len(parts) == 2 {
				existingAppName = parts[1]
			}
		}
		// Create an app
		fmt.Println("Let's create a new app.")
		username, appname, color, icon, err := getAnswers(sessid, existingAppName)
		if err != nil {
			return err
		}

		appObject, err = wire.CreateNewApp(username, appname, color, icon)
		if err != nil {
			return err
		}

		appFullName = appObject.FullName

		fmt.Println("Created new app: " + appFullName)
	}

	generateURL := "version/uesio/core/v0.0.1/metadata/generate/uesio/core/init"

	payloadBytes := &bytes.Buffer{}

	err = json.NewEncoder(payloadBytes).Encode(&map[string]string{"name": appFullName})
	if err != nil {
		return err
	}
	resp, err := call.Post(generateURL, payloadBytes, sessid, nil)
	if err != nil {
		return err
	}

	err = zip.Unzip(resp.Body, "")
	if err != nil {
		return err
	}

	fmt.Printf("Successfully initialized app '%s'. Retrieving metadata... \n", appFullName)

	// Prompt user to select a workspace (TODO: or bundle version) to clone from
	// if there are no workspaces, create one first
	workspaceName, err := ws.SetWorkspacePrompt(appObject.ID)

	if err != nil {
		return err
	}

	if err = workspace.RetrieveBundleForAppWorkspace(appFullName, workspaceName, ""); err != nil {
		return err
	}

	if err = installDeps(""); err != nil {
		return err
	}

	fmt.Printf("Successfully retrieved app metadata bundle for workspace '%s'\n", workspaceName)

	return nil
}

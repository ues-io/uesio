package ws

import (
	"errors"
	"github.com/AlecAivazis/survey/v2"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/cli/pkg/wire"
)

func GetWorkspace() (string, error) {
	return config.GetConfigValue("workspace")
}

func SetWorkspace(value string) error {
	return config.SetConfigValue("workspace", value)
}

func SetWorkspacePrompt(username string, appId string) (string, error) {
	workspace := ""

	appID := appId
	var err error

	if appID == "" {
		appID, err = wire.GetAppID()
		if err != nil {
			return "", err
		}
	}

	options, err := wire.GetAvailableWorkspaceNames(appID)
	if err != nil {
		return "", err
	}

	// If there's only one workspace, just use that one.
	if len(options) == 1 {
		return options[0], SetWorkspace(options[0])
	}
	if len(options) == 0 {

		if username == "" {
			return "", errors.New("no workspaces found")
		}

		var newWorkspace string
		err = survey.AskOne(&survey.Select{
			Message: "No workspaces found. Enter a workspace name",
			Default: "dev",
		}, &newWorkspace)

		// Invoke workspace creation API to create a default "dev" workspace
		_, err := wire.CreateNewWorkspace(username, appID, newWorkspace)
		if err != nil {
			return "", errors.New("unable to create new workspace for app")
		}
		return newWorkspace, SetWorkspace(newWorkspace)
	}

	err = survey.AskOne(&survey.Select{
		Message: "Select a workspace.",
		Options: options,
	}, &workspace)
	if err != nil {
		return "", err
	}
	return workspace, SetWorkspace(workspace)
}
